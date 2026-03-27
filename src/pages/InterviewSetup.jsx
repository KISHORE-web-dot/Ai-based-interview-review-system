import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import { api } from '../services/api';
import { Loader2 } from 'lucide-react';
import './InterviewSetup.css';

const InterviewSetup = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const interviewType = location.state?.interviewType || 'voice';

    const [formData, setFormData] = useState({
        type: 'campus',
        language: 'english',
        difficulty: 'medium',
        duration: '20'
    });

    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleStartInterview = async () => {
        setIsLoading(true);
        try {
            // Get resume text from storage
            const resumeText = localStorage.getItem('resumeText') || 'Student with React and JavaScript skills';

            console.log('Starting interview with Python backend...');
            const sessionData = await api.startInterview({
                resume_text: resumeText,
                type: formData.type, // e.g., 'Campus'
                difficulty: formData.difficulty,
                language: formData.language
            });

            console.log('Session created:', sessionData);

            navigate('/interview', {
                state: {
                    ...formData,
                    interviewType,
                    sessionId: sessionData.session_id,
                    initialQuestions: sessionData.questions
                }
            });
        } catch (error) {
            console.error('Failed to start interview:', error);
            alert('Failed to start interview. Check if Python backend is running.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="setup-container">
            <div className="setup-header">
                <h1>Interview Setup</h1>
                <p>Configure your interview preferences before starting</p>
            </div>

            <Card className="form-section">
                <h3>Interview Type</h3>
                <div className="form-group">
                    <div className="radio-group">
                        <div className="radio-option">
                            <input
                                type="radio"
                                id="campus"
                                name="type"
                                value="campus"
                                checked={formData.type === 'campus'}
                                onChange={(e) => handleChange('type', e.target.value)}
                            />
                            <label htmlFor="campus" className="radio-label">Campus Interview</label>
                        </div>
                        <div className="radio-option">
                            <input
                                type="radio"
                                id="psu"
                                name="type"
                                value="psu"
                                checked={formData.type === 'psu'}
                                onChange={(e) => handleChange('type', e.target.value)}
                            />
                            <label htmlFor="psu" className="radio-label">PSU Interview</label>
                        </div>
                        <div className="radio-option">
                            <input
                                type="radio"
                                id="govt"
                                name="type"
                                value="govt"
                                checked={formData.type === 'govt'}
                                onChange={(e) => handleChange('type', e.target.value)}
                            />
                            <label htmlFor="govt" className="radio-label">Government Interview</label>
                        </div>
                    </div>
                </div>
            </Card>

            <Card className="form-section">
                <h3>Language Preference</h3>
                <div className="form-group">
                    <select
                        className="form-select"
                        value={formData.language}
                        onChange={(e) => handleChange('language', e.target.value)}
                    >
                        <option value="english">English</option>
                        <option value="hindi">Hindi</option>
                        <option value="bilingual">Bilingual (Hindi + English)</option>
                    </select>
                </div>
            </Card>

            <Card className="form-section">
                <h3>Difficulty Level</h3>
                <div className="form-group">
                    <div className="radio-group">
                        <div className="radio-option">
                            <input
                                type="radio"
                                id="easy"
                                name="difficulty"
                                value="easy"
                                checked={formData.difficulty === 'easy'}
                                onChange={(e) => handleChange('difficulty', e.target.value)}
                            />
                            <label htmlFor="easy" className="radio-label">Beginner</label>
                        </div>
                        <div className="radio-option">
                            <input
                                type="radio"
                                id="medium"
                                name="difficulty"
                                value="medium"
                                checked={formData.difficulty === 'medium'}
                                onChange={(e) => handleChange('difficulty', e.target.value)}
                            />
                            <label htmlFor="medium" className="radio-label">Intermediate</label>
                        </div>
                        <div className="radio-option">
                            <input
                                type="radio"
                                id="hard"
                                name="difficulty"
                                value="hard"
                                checked={formData.difficulty === 'hard'}
                                onChange={(e) => handleChange('difficulty', e.target.value)}
                            />
                            <label htmlFor="hard" className="radio-label">Advanced</label>
                        </div>
                    </div>
                </div>
            </Card>

            <Card className="form-section">
                <h3>Interview Duration</h3>
                <div className="form-group">
                    <select
                        className="form-select"
                        value={formData.duration}
                        onChange={(e) => handleChange('duration', e.target.value)}
                    >
                        <option value="10">10 minutes</option>
                        <option value="20">20 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="45">45 minutes</option>
                    </select>
                </div>
            </Card>

            <div className="setup-actions">
                <Button variant="secondary" onClick={() => navigate('/dashboard')}>
                    Cancel
                </Button>
                <Button variant="primary" size="large" onClick={handleStartInterview} disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 size={20} className="animate-spin" style={{ marginRight: '8px' }} />
                            Generated Questions...
                        </>
                    ) : (
                        'Start Interview'
                    )}
                </Button>
            </div>
        </div>
    );
};

export default InterviewSetup;
