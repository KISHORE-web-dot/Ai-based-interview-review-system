import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mic, MicOff, Clock, Volume2, AlertCircle, Camera } from 'lucide-react';
import Button from '../components/Button';
import { api } from '../services/api';
import './LiveInterview.css';

const LiveInterview = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const setupData = location.state || {};
    const interviewType = setupData.type || 'voice'; // voice, panel, stress

    // Interview type configurations
    const INTERVIEW_CONFIGS = {
        voice: {
            interviewerCount: 1,
            silenceDuration: 2500,
            showTimer: false,
            interviewerLabel: 'single'
        },
        panel: {
            interviewerCount: 3,
            silenceDuration: 2500,
            showTimer: false,
            interviewerLabel: 'panel',
            rotateInterviewers: true
        },
        stress: {
            interviewerCount: 1,
            silenceDuration: 1500, // Faster for stress
            showTimer: true,
            interviewerLabel: 'single',
            fastPaced: true
        }
    };

    const config = INTERVIEW_CONFIGS[interviewType] || INTERVIEW_CONFIGS.voice;

    const [isRecording, setIsRecording] = useState(false);
    const [activeInterviewer, setActiveInterviewer] = useState(null);
    const [timer, setTimer] = useState(0);
    const [questionTimer, setQuestionTimer] = useState(0); // For stress mode
    const [transcript, setTranscript] = useState('');
    const [messages, setMessages] = useState([]);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [interviewState, setInterviewState] = useState('STARTING'); // STARTING, AI_SPEAKING, LISTENING, SILENCE_DETECTED, PROCESSING

    // AI Integration State
    const [questions, setQuestions] = useState(setupData.initialQuestions || []);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [qaList, setQaList] = useState([]); // Store Q&A for final feedback
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    // Camera State
    const [hasCamera, setHasCamera] = useState(false);

    const [isTimeUp, setIsTimeUp] = useState(false);

    const recognitionRef = useRef(null);
    const silenceTimerRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const animationFrameRef = useRef(null);
    const lastSpeechTimeRef = useRef(Date.now());
    const videoRef = useRef(null);
    const framesRef = useRef([]);

    const SILENCE_THRESHOLD = 30; // Audio level threshold
    const MIN_ANSWER_LENGTH = 10; // Minimum characters before allowing auto-submit


    const interviewers = [
        { id: 0, name: 'Priya Sharma', role: 'HR Manager', emoji: '👩‍💼', rate: 1.0, pitch: 1.1 },
        { id: 1, name: 'Rajesh Kumar', role: 'Technical Lead', emoji: '👨‍💻', rate: 0.9, pitch: 0.9 },
        { id: 2, name: 'Anjali Patel', role: 'Dept. Head', emoji: '👩‍💼', rate: 1.1, pitch: 1.2 }
    ];

    // Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event) => {
                let finalTranscript = '';
                let interimTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                if (finalTranscript) {
                    setTranscript(prev => (prev + ' ' + finalTranscript).trim());
                    lastSpeechTimeRef.current = Date.now();
                }
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                if (event.error === 'no-speech') {
                    // Restart if no speech detected
                    if (isRecording && interviewState === 'LISTENING') {
                        setTimeout(() => {
                            try {
                                recognitionRef.current?.start();
                            } catch (e) {
                                // Ignore if already started
                            }
                        }, 100);
                    }
                }
            };

            recognitionRef.current.onend = () => {
                // Auto-restart if still in listening mode
                if (isRecording && interviewState === 'LISTENING') {
                    try {
                        recognitionRef.current?.start();
                    } catch (e) {
                        // Ignore if already started
                    }
                }
            };
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            window.speechSynthesis.cancel();
            if (silenceTimerRef.current) {
                clearInterval(silenceTimerRef.current);
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Camera Setup
    useEffect(() => {
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setHasCamera(true);
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                setHasCamera(false);
            }
        };
        startCamera();
        
        return () => {
             if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const captureFrame = () => {
        if (!videoRef.current || !hasCamera) return;
        try {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.5); // compress
            framesRef.current.push(dataUrl);
        } catch (e) {
            console.error("Failed to capture frame:", e);
        }
    };

    // Silence Detection Monitor
    useEffect(() => {
        if (interviewState === 'LISTENING' && transcript.length >= MIN_ANSWER_LENGTH) {
            silenceTimerRef.current = setInterval(() => {
                const silenceDuration = Date.now() - lastSpeechTimeRef.current;

                if (silenceDuration >= config.silenceDuration) {
                    console.log('Silence detected, auto-submitting...');
                    setInterviewState('SILENCE_DETECTED');
                    clearInterval(silenceTimerRef.current);
                    handleAutoSubmit();
                }
            }, 500); // Check every 500ms

            return () => {
                if (silenceTimerRef.current) {
                    clearInterval(silenceTimerRef.current);
                }
            };
        }
    }, [interviewState, transcript]);

    // Timer
    useEffect(() => {
        const interval = setInterval(() => { setTimer(prev => prev + 1); }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Automatic Duration Termination Logic
    useEffect(() => {
        if (!setupData.duration || isTimeUp) return;
        
        const limitSeconds = parseInt(setupData.duration) * 60;
        
        // If timer exceeds duration, auto end
        if (timer >= limitSeconds && timer > 0) {
            setIsTimeUp(true);
            setInterviewState('PROCESSING');
            
            setMessages(prev => [...prev, {
                sender: 'System',
                text: `⏱ Time limit (${setupData.duration} mins) reached! Completing interview...`,
                type: 'system'
            }]);
            
            window.speechSynthesis.cancel();
            stopListening();
            
            setTimeout(() => {
                // Trigger natural navigation exactly like the manual end button
                let currentVideo = videoRef.current;
                if (currentVideo && currentVideo.srcObject) {
                    currentVideo.srcObject.getTracks().forEach(track => track.stop());
                }
                navigate('/feedback', {
                    state: {
                        qaList,
                        sessionId: setupData.sessionId,
                        frames: framesRef.current
                    }
                });
            }, 3000);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timer, setupData.duration, isTimeUp, navigate, setupData.sessionId, qaList]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Text-to-Speech
    const speak = (text, interviewerId) => {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        const interviewer = interviewers.find(i => i.id === interviewerId);

        setActiveInterviewer(interviewerId);
        setIsSpeaking(true);
        setInterviewState('AI_SPEAKING');

        utterance.rate = interviewer ? interviewer.rate : 1;
        utterance.pitch = interviewer ? interviewer.pitch : 1;

        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) utterance.voice = voices[interviewerId % voices.length];

        utterance.onend = () => {
            setActiveInterviewer(null);
            setIsSpeaking(false);
            // Auto-start listening after AI finishes speaking
            setTimeout(() => {
                startListening();
            }, 500);
        };

        window.speechSynthesis.speak(utterance);

        setMessages(prev => [...prev, {
            sender: interviewer.name,
            text: text,
            type: 'interviewer'
        }]);
    };

    // Start Interview w/ First Question
    useEffect(() => {
        const handleVoicesChanged = () => {
            setTimeout(() => {
                if (questions.length > 0 && messages.length === 0) {
                    const firstQ = questions[0].text;
                    speak(`Hello! Welcome. ${firstQ}`, 0);
                } else if (messages.length === 0) {
                    speak("Hello! Please introduce yourself.", 0);
                }
            }, 1000);
        };

        window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
        handleVoicesChanged();

        return () => { window.speechSynthesis.onvoiceschanged = null; };
    }, [questions]);

    const startListening = () => {
        setTranscript('');
        setIsRecording(true);
        setInterviewState('LISTENING');
        lastSpeechTimeRef.current = Date.now();

        try {
            recognitionRef.current?.start();
        } catch (e) {
            console.log('Recognition already started');
        }
    };

    const stopListening = () => {
        setIsRecording(false);
        try {
            recognitionRef.current?.stop();
        } catch (e) {
            console.log('Recognition already stopped');
        }
    };

    const handleAutoSubmit = async () => {
        stopListening();

        if (!transcript.trim()) {
            // If no transcript, restart listening
            setTimeout(() => startListening(), 1000);
            return;
        }

        if (hasCamera) {
            captureFrame();
        }

        setInterviewState('PROCESSING');
        setIsAnalyzing(true);

        const currentQ = questions[currentQuestionIndex]?.text || "Introduction";
        const answerText = transcript.trim();

        setMessages(prev => [...prev, { sender: 'You', text: answerText, type: 'candidate' }]);

        try {
            const feedback = await api.analyzeAnswer(currentQ, answerText);

            // Add Feedback to UI (as system message)
            setMessages(prev => [...prev, {
                sender: 'AI Feedback',
                text: `${feedback.feedback} (Score: ${feedback.score}/10)`,
                type: 'system'
            }]);

            setQaList(prev => [...prev, { question: currentQ, answer: answerText, analysis: feedback }]);

            // Move to Next Question
            setTimeout(() => {
                const nextIndex = currentQuestionIndex + 1;
                if (nextIndex < questions.length) {
                    setCurrentQuestionIndex(nextIndex);

                    // Determine which interviewer should ask the question
                    let interviewerId = 0;

                    if (interviewType === 'panel' && questions[nextIndex].interviewer) {
                        // For panel, map interviewer names to IDs
                        const interviewerMap = {
                            'HR Manager': 0,
                            'Technical Lead': 1,
                            'Department Head': 2
                        };
                        interviewerId = interviewerMap[questions[nextIndex].interviewer] || nextIndex % 3;
                    } else if (interviewType === 'panel') {
                        // Fallback rotation for panel
                        interviewerId = nextIndex % 3;
                    } else {
                        // Voice and Stress use single interviewer
                        interviewerId = 0;
                    }

                    speak(questions[nextIndex].text, interviewerId);
                } else {
                    handleEndInterview();
                }
            }, 2000);

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                sender: 'System',
                text: 'Error analyzing your answer. Moving to next question...',
                type: 'system'
            }]);

            setTimeout(() => {
                const nextIndex = currentQuestionIndex + 1;
                if (nextIndex < questions.length) {
                    setCurrentQuestionIndex(nextIndex);
                    speak(questions[nextIndex].text, nextIndex % 3);
                } else {
                    handleEndInterview();
                }
            }, 2000);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleEndInterview = async () => {
        window.speechSynthesis.cancel();
        stopListening();
        
        // Stop video camera tracks
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
        
        navigate('/feedback', {
            state: {
                qaList,
                sessionId: setupData.sessionId,
                frames: framesRef.current
            }
        });
    };

    const getStateMessage = () => {
        switch (interviewState) {
            case 'AI_SPEAKING':
                return 'Interviewer is speaking...';
            case 'LISTENING':
                return '🎤 Listening... (Speak naturally, I\'ll detect when you\'re done)';
            case 'SILENCE_DETECTED':
                return 'Silence detected, processing your answer...';
            case 'PROCESSING':
                return '⏳ Analyzing your response...';
            default:
                return 'Starting interview...';
        }
    };

    return (
        <div className="interview-container">
            <div className="interview-header">
                <div className="interview-info">
                    <h2>{setupData.type ? `${setupData.type.charAt(0).toUpperCase() + setupData.type.slice(1)} Interview` : 'Live Interview'}</h2>
                    <div className="interview-meta">
                        <span>Difficulty: {setupData.difficulty || 'Medium'}</span>
                    </div>
                </div>
                <div className="interview-timer">
                    <Clock size={20} />
                    {formatTime(timer)}
                    {config.showTimer && questions[currentQuestionIndex]?.timeLimit && (
                        <span style={{ marginLeft: '1rem', color: '#f59e0b', fontWeight: 'bold' }}>
                            | Limit: {questions[currentQuestionIndex].timeLimit}s
                        </span>
                    )}
                </div>
            </div>
            
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
                {/* Main Video Area */}
                <div style={{ flex: 1, backgroundColor: '#1e293b', borderRadius: '1rem', overflow: 'hidden', position: 'relative', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {!hasCamera && (
                         <div style={{ color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                             <Camera size={48} />
                             <p>Camera is off or unavailable</p>
                         </div>
                    )}
                    <video 
                         ref={videoRef} 
                         autoPlay 
                         playsInline 
                         muted 
                         style={{ width: '100%', height: '100%', objectFit: 'cover', display: hasCamera ? 'block' : 'none', transform: 'scaleX(-1)' }} 
                    />
                    
                    {/* Recording indicator */}
                    {isRecording && (
                        <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(239, 68, 68, 0.8)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', animation: 'pulse 2s infinite' }}>
                            <div style={{ width: '8px', height: '8px', background: 'white', borderRadius: '50%' }}></div>
                            REC
                        </div>
                    )}
                </div>
                
                {/* Interviewers Panel (Side) */}
                <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {interviewers.slice(0, config.interviewerCount).map((interviewer) => (
                        <div
                            key={interviewer.id}
                            className={`interviewer-card ${activeInterviewer === interviewer.id ? 'active' : ''}`}
                            style={{ flex: 1 }}
                        >
                            <div className="interviewer-avatar">{interviewer.emoji}</div>
                            <div className="interviewer-name">{interviewer.name}</div>
                            <div className="interviewer-role">{interviewer.role}</div>
                            {activeInterviewer === interviewer.id && (
                                <div className="speaking-indicator"><Volume2 size={16} /> Speaking...</div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="conversation-panel">
                {messages.map((message, index) => (
                    <div key={index} className={`message ${message.type}`}>
                        <div className="message-sender">{message.sender}</div>
                        <div className="message-text">{message.text}</div>
                    </div>
                ))}
                {isRecording && transcript && (
                    <div className="message candidate">
                        <div className="message-sender">You (Speaking...)</div>
                        <div className="message-text">{transcript}</div>
                    </div>
                )}
            </div>

            <div className="interview-controls">
                <div className={`mic-indicator ${isRecording ? 'active' : 'inactive'}`}>
                    {isRecording ? <Mic size={32} /> : <MicOff size={32} />}
                </div>
                <div className="control-hint">
                    {isRecording ? 'Listening... Speak naturally' : 'Waiting for next question...'}
                </div>
            </div>

            <div className="interview-actions">
                <Button variant="secondary" onClick={handleEndInterview}>End Interview</Button>
            </div>
        </div>
    );
};

export default LiveInterview;
