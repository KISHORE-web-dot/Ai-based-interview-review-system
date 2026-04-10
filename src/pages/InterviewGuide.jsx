import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    FileText, Mic, Monitor, Clock, CheckCircle,
    ChevronRight, AlertCircle, Lightbulb, Volume2,
    Cpu, Star, BarChart2, MessageSquare, Award, RefreshCw
} from 'lucide-react';
import './InterviewGuide.css';

const steps = [
    {
        icon: <FileText size={28} />,
        color: '#3b82f6',
        title: 'Upload Your Resume',
        description: 'Prepare a text-based PDF resume. Image-only or scanned PDFs may not extract properly and will result in generic questions.',
        tips: ['Use a .pdf file for best results', 'Make sure the PDF has selectable text, not just an image', 'Keep your resume under 5MB'],
    },
    {
        icon: <Mic size={28} />,
        color: '#10b981',
        title: 'Allow Microphone Access',
        description: 'The system uses your microphone to capture your spoken answers. You must grant permission when the browser asks.',
        tips: ['Click "Allow" when your browser asks for mic access', 'Speak clearly and at a moderate pace', 'Use a quiet environment to avoid transcription errors'],
    },
    {
        icon: <Monitor size={28} />,
        color: '#8b5cf6',
        title: 'Use a Supported Browser',
        description: 'Speech recognition is only supported in Google Chrome and Microsoft Edge. Firefox and Safari will not work.',
        tips: ['Open this app in Google Chrome or Microsoft Edge', 'Keep the browser tab active during the interview', 'Do not switch tabs or minimize the window'],
    },
    {
        icon: <Clock size={28} />,
        color: '#f59e0b',
        title: 'Choose Difficulty & Duration',
        description: 'Select the difficulty level that matches your experience. You can also set how long you want the session to last.',
        tips: ['Easy – for freshers and entry-level roles', 'Intermediate – for 1–3 years of experience', 'Hard – for senior roles and technical interviews'],
    },
    {
        icon: <Volume2 size={28} />,
        color: '#ef4444',
        title: 'Answer Questions Verbally',
        description: 'Each question will be displayed on screen. Speak your answer out loud clearly — the AI will transcribe and evaluate it.',
        tips: ['Wait for the question to fully appear before answering', 'Speak in complete sentences using the STAR method when relevant', 'Click "End Interview" when you are done to get your feedback'],
    },
];

const InterviewGuide = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const interviewType = location.state?.interviewType || 'voice';
    const [checked, setChecked] = useState([]);

    const toggle = (i) =>
        setChecked(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);

    const allChecked = checked.length === steps.length;

    const handleContinue = () => {
        navigate('/upload', { state: { interviewType } });
    };

    return (
        <div className="guide-container">
            {/* Header */}
            <div className="guide-hero">
                <div className="guide-hero-badge">
                    <Lightbulb size={16} />
                    Interview Prep Guide
                </div>
                <h1 className="guide-title">Before You Begin</h1>
                <p className="guide-subtitle">
                    Follow these steps to ensure a smooth, accurate, and fair interview session.
                    Check off each item when you're ready.
                </p>
            </div>

            {/* Steps */}
            <div className="guide-steps">
                {steps.map((step, i) => {
                    const done = checked.includes(i);
                    return (
                        <div
                            key={i}
                            className={`guide-step ${done ? 'guide-step--done' : ''}`}
                            onClick={() => toggle(i)}
                        >
                            <div className="guide-step-left">
                                <div className="guide-step-icon" style={{ color: step.color, background: `${step.color}18` }}>
                                    {step.icon}
                                </div>
                                <div className="guide-step-connector" />
                            </div>

                            <div className="guide-step-body">
                                <div className="guide-step-header">
                                    <div>
                                        <span className="guide-step-number">Step {i + 1}</span>
                                        <h3 className="guide-step-title">{step.title}</h3>
                                    </div>
                                    <div className={`guide-step-check ${done ? 'guide-step-check--done' : ''}`}>
                                        <CheckCircle size={22} />
                                    </div>
                                </div>

                                <p className="guide-step-desc">{step.description}</p>

                                <ul className="guide-step-tips">
                                    {step.tips.map((tip, j) => (
                                        <li key={j}>
                                            <ChevronRight size={14} />
                                            {tip}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Warning Banner */}
            <div className="guide-warning">
                <AlertCircle size={18} />
                <span>
                    If you skip any of these steps, your interview scores and transcript accuracy may be affected.
                    Especially ensure your <strong>microphone is working</strong> before continuing.
                </span>
            </div>

            {/* How It Works */}
            <div className="guide-section">
                <h2 className="guide-section-title">How It Works</h2>
                <p className="guide-section-sub">Your complete interview journey in 4 simple stages</p>
                <div className="guide-flow">
                    {[
                        { icon: <FileText size={22} />, color: '#3b82f6', label: 'Upload Resume', desc: 'The AI reads your resume and tailors every question to your actual experience and skills.' },
                        { icon: <Cpu size={22} />, color: '#8b5cf6', label: 'AI Generates Questions', desc: 'Gemini AI creates unique, role-specific questions based on your profile and chosen difficulty.' },
                        { icon: <Mic size={22} />, color: '#10b981', label: 'You Answer Verbally', desc: 'Speak your answers aloud. Your browser transcribes them in real-time using speech recognition.' },
                        { icon: <BarChart2 size={22} />, color: '#f59e0b', label: 'Get Detailed Feedback', desc: 'Click End Interview and receive a full performance report with scores, strengths, and next steps.' },
                    ].map((item, i, arr) => (
                        <React.Fragment key={i}>
                            <div className="guide-flow-step">
                                <div className="guide-flow-icon" style={{ color: item.color, background: `${item.color}18` }}>
                                    {item.icon}
                                </div>
                                <div className="guide-flow-num">{i + 1}</div>
                                <h4 className="guide-flow-label">{item.label}</h4>
                                <p className="guide-flow-desc">{item.desc}</p>
                            </div>
                            {i < arr.length - 1 && <div className="guide-flow-arrow">›</div>}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* How Feedback Works */}
            <div className="guide-section">
                <h2 className="guide-section-title">How Your Feedback Is Generated</h2>
                <p className="guide-section-sub">After your session, the AI evaluates you across 4 key dimensions</p>
                <div className="guide-scores">
                    {[
                        { icon: <Star size={20} />, color: '#3b82f6', label: 'Confidence', desc: 'How assertively and clearly you communicated your ideas without hesitation or filler words.' },
                        { icon: <MessageSquare size={20} />, color: '#10b981', label: 'Communication', desc: 'Structure, clarity, and eloquence of your answers — including grammar and coherence.' },
                        { icon: <Cpu size={20} />, color: '#8b5cf6', label: 'Technical Skills', desc: 'Accuracy and depth of your domain knowledge based on the role requirements in your resume.' },
                        { icon: <RefreshCw size={20} />, color: '#ef4444', label: 'Stress Handling', desc: 'How well you handled unexpected or pressure-oriented questions without breaking composure.' },
                    ].map((item, i) => (
                        <div className="guide-score-card" key={i}>
                            <div className="guide-score-icon" style={{ color: item.color, background: `${item.color}18` }}>
                                {item.icon}
                            </div>
                            <h4 className="guide-score-label">{item.label}</h4>
                            <p className="guide-score-desc">{item.desc}</p>
                        </div>
                    ))}
                </div>
                <div className="guide-feedback-note">
                    <Award size={16} />
                    <span>Each dimension is scored from <strong>0 to 100</strong>. You'll also receive a list of <strong>Strengths</strong>, <strong>Weaknesses</strong>, and <strong>Actionable Next Steps</strong> written specifically for you.</span>
                </div>
            </div>

            {/* CTA */}
            <div className="guide-cta">
                {!allChecked && (
                    <p className="guide-cta-hint">
                        ✅ Check off all {steps.length} steps above to unlock the Continue button
                    </p>
                )}
                <button
                    className={`guide-cta-btn ${allChecked ? 'guide-cta-btn--ready' : 'guide-cta-btn--locked'}`}
                    onClick={allChecked ? handleContinue : undefined}
                    disabled={!allChecked}
                >
                    {allChecked ? (
                        <>I'm Ready — Upload Resume <ChevronRight size={20} /></>
                    ) : (
                        `Check all steps to continue (${checked.length}/${steps.length})`
                    )}
                </button>
            </div>
        </div>
    );
};

export default InterviewGuide;
