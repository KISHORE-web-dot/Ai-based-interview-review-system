import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import FileUpload from '../components/FileUpload';
import Button from '../components/Button';
import { api } from '../services/api';
import './ResumeUpload.css';

const ResumeUpload = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const interviewType = location.state?.interviewType || 'voice';
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    
    // New state for 2-step process
    const [step, setStep] = useState(1);
    const [uploadedText, setUploadedText] = useState('');
    
    // Configuration State
    const [difficulty, setDifficulty] = useState('intermediate');
    const [duration, setDuration] = useState('10');

    const handleFileSelect = (selectedFile) => {
        setFile(selectedFile);
        setError('');
    };

    const handleContinue = async () => {
        if (!file) return;

        setIsUploading(true);
        setError('');

        try {
            console.log('Uploading file to Python backend...');
            const result = await api.uploadResume(file);
            console.log('Upload success:', result);

            // Store resume text and status
            localStorage.setItem('resumeUploaded', 'true');
            localStorage.setItem('resumeText', result.text);
            localStorage.setItem('resumeFilename', result.filename);
            
            setUploadedText(result.text);
            setStep(2); // Move to configuration step
        } catch (err) {
            console.error('Upload failed:', err);
            setError('Failed to upload resume. Is the backend running on port 8000?');
        } finally {
            setIsUploading(false);
        }
    };

    const handleStartInterview = async () => {
        setIsUploading(true);
        try {
            const formData = {
                type: interviewType,
                language: 'english',
                difficulty: difficulty,
                duration: duration
            };
            
            console.log(`Starting ${interviewType} interview with ${difficulty} difficulty for ${duration} mins...`);
            const sessionData = await api.startInterview({
                resume_text: uploadedText,
                type: formData.type,
                difficulty: formData.difficulty,
                language: formData.language
            });

            navigate('/interview', {
                state: {
                    ...formData,
                    interviewType: interviewType,
                    sessionId: sessionData.session_id,
                    initialQuestions: sessionData.questions
                }
            });
        } catch (err) {
            console.error('Failed to start:', err);
            setError('Failed to start interview.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="upload-container">
            <div className="upload-header">
                <h1>Welcome to InterviewIQ</h1>
                <p>
                    India's first AI-powered interview preparation platform.
                    Upload your resume to get started with personalized interview practice.
                </p>
            </div>

            {step === 1 ? (
                <>
                    <FileUpload onFileSelect={handleFileSelect} />

                    {error && (
                        <div style={{ color: 'var(--error)', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <div className="why-resume">
                        <h3>
                            <AlertCircle size={20} />
                            Why we need your resume
                        </h3>
                        <ul>
                            <li>Generate personalized interview questions based on your experience and skills</li>
                            <li>Tailor difficulty levels to match your career stage and background</li>
                            <li>Code generation and system design topics relevant to your profile</li>
                            <li>Analyze your profile to identify key strengths and improvement areas</li>
                        </ul>
                    </div>

                    <div className="upload-actions">
                        <Button
                            variant="primary"
                            size="large"
                            onClick={handleContinue}
                            disabled={!file || isUploading}
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" style={{ marginRight: '8px' }} />
                                    Processing Resume...
                                </>
                            ) : (
                                'Continue'
                            )}
                        </Button>
                    </div>
                </>
            ) : (
                <div style={{ backgroundColor: 'var(--bg-primary)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', marginBottom: '1.5rem', justifyContent: 'center', fontWeight: '600' }}>
                        <CheckCircle size={24} />
                        Successfully Analyzed Resume
                    </div>
                    
                    <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>Step 2: Configure Interview</h3>
                    
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Select Difficulty</label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {['easy', 'intermediate', 'hard'].map(level => (
                                <button 
                                    key={level}
                                    onClick={() => setDifficulty(level)}
                                    style={{
                                        flex: 1, padding: '0.75rem', borderRadius: '8px', 
                                        border: `2px solid ${difficulty === level ? 'var(--primary)' : 'var(--border)'}`,
                                        background: difficulty === level ? 'var(--bg-tertiary)' : 'transparent',
                                        color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 500, textTransform: 'capitalize'
                                    }}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Select Timing (Minutes)</label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {['5', '10', '20'].map(time => (
                                <button 
                                    key={time}
                                    onClick={() => setDuration(time)}
                                    style={{
                                        flex: 1, padding: '0.75rem', borderRadius: '8px', 
                                        border: `2px solid ${duration === time ? 'var(--warning)' : 'var(--border)'}`,
                                        background: duration === time ? 'rgba(245,158,11,0.1)' : 'transparent',
                                        color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 500
                                    }}
                                >
                                    {time} min
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="upload-actions">
                        <Button
                            variant="primary"
                            size="large"
                            onClick={handleStartInterview}
                            disabled={isUploading}
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" style={{ marginRight: '8px' }} />
                                    Starting Interview...
                                </>
                            ) : (
                                `Start ${interviewType.charAt(0).toUpperCase() + interviewType.slice(1)} Interview`
                            )}
                        </Button>
                    </div>
                </div>
            )}

            <div className="privacy-note">
                <p>
                    🔒 Your data is secure and private. We never share your information with third parties.
                </p>
            </div>
        </div>
    );
};

export default ResumeUpload;
