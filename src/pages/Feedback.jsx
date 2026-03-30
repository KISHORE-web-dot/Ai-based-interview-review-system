import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, TrendingUp, Brain, MessageSquare, Target, Award, AlertCircle, Camera } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import { api } from '../services/api';
import './Feedback.css';

const Feedback = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { qaList, sessionId, frames } = location.state || {};

    const [loading, setLoading] = useState(true);
    const [feedbackData, setFeedbackData] = useState(null);
    const [error, setError] = useState(null);

    const normalizeList = (value, fallback) => {
        if (Array.isArray(value) && value.length > 0) {
            return value;
        }
        return fallback;
    };

    useEffect(() => {
        const generateFeedback = async () => {
            if (!sessionId || !qaList) {
                setError("Missing interview data");
                setLoading(false);
                return;
            }

            try {
                const data = await api.endInterview(sessionId, qaList, frames || []);
                setFeedbackData(data);
            } catch (err) {
                console.error("Feedback error:", err);
                setError(err.message || "Failed to generate feedback. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        generateFeedback();
    }, [sessionId, qaList]);

    if (loading) {
        return (
            <div className="feedback-container loading-container">
                <div className="loader-content">
                    <div className="loader-spinner"></div>
                    <h2>Generating Feedback...</h2>
                    <p>AI is analyzing your answers and performance</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="feedback-container error-container">
                <AlertCircle size={48} color="#ef4444" />
                <h2>Error</h2>
                <p>{error}</p>
                <Button variant="primary" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
            </div>
        );
    }

    if (!feedbackData) return null;

    const strengths = normalizeList(feedbackData.strengths, [
        'You completed the interview flow and submitted your responses.',
        'You stayed engaged through the practice session.'
    ]);

    const weaknesses = normalizeList(feedbackData.weaknesses, [
        'More detailed examples would make your answers stronger.',
        'Practice structuring answers more clearly before the next attempt.'
    ]);

    const nextSteps = normalizeList(feedbackData.next_steps, [
        'Practice another round and focus on concise, example-driven answers.',
        'Review common interview questions and prepare STAR-based responses.',
        'Work on posture, pace, and clarity during spoken answers.'
    ]);

    const overallScore = Number.isFinite(Number(feedbackData.overall_score)) ? Number(feedbackData.overall_score) : 0;
    const getScore = (...values) => {
        const valid = values
            .map((value) => Number(value))
            .find((value) => Number.isFinite(value));
        return valid ?? overallScore;
    };

    const scores = [
        { label: 'Confidence', score: getScore(feedbackData.scores?.Confidence), icon: <Brain size={20} />, color: 'primary' },
        { label: 'Communication', score: getScore(feedbackData.scores?.Communication), icon: <MessageSquare size={20} />, color: 'accent' },
        { label: 'Technical Skills', score: getScore(feedbackData.scores?.["Technical Skills"], feedbackData.scores?.Technical, feedbackData.scores?.["Technical Knowledge"]), icon: <Target size={20} />, color: 'primary' }
    ];

    if (feedbackData.body_language_score !== undefined && feedbackData.body_language_score !== null) {
        scores.push({
            label: 'Body Language',
            score: Number(feedbackData.body_language_score) <= 10 ? Number(feedbackData.body_language_score) * 10 : Number(feedbackData.body_language_score),
            icon: <Camera size={20} />,
            color: 'accent'
        });
    }

    scores.push({ label: 'Overall Score', score: overallScore, icon: <Award size={20} />, color: 'accent' });


    return (
        <div className="feedback-container">
            <div className="feedback-header">
                <h1>Interview Complete!</h1>
                <div className="feedback-status">
                    <CheckCircle size={20} />
                    Performance Analyzed
                </div>
            </div>

            <div className="scores-grid">
                {scores.map((item, index) => (
                    <div key={index} className={`score-card score-${item.color}`}>
                        <div className="score-label">{item.label}</div>
                        <div className="score-circle">
                            <div className="score-value">{item.score}</div>
                        </div>
                        <div className="score-icon">{item.icon}</div>
                    </div>
                ))}
            </div>

            <div className="feedback-sections">
                <Card className="feedback-section">
                    <div className="section-icon success">
                        <CheckCircle size={24} />
                    </div>
                    <h3>Key Strengths</h3>
                    <ul className="feedback-list">
                        {strengths.map((strength, index) => (
                            <li key={index}>{strength}</li>
                        ))}
                    </ul>
                </Card>

                <Card className="feedback-section">
                    <div className="section-icon warning">
                        <TrendingUp size={24} />
                    </div>
                    <h3>Areas for Improvement</h3>
                    <ul className="feedback-list">
                        {weaknesses.map((weakness, index) => (
                            <li key={index}>{weakness}</li>
                        ))}
                    </ul>
                </Card>
                
                {feedbackData.body_language_feedback && (
                    <Card className="feedback-section" style={{ gridColumn: '1 / -1' }}>
                         <div className="section-icon info" style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)' }}>
                             <Camera size={24} />
                         </div>
                         <h3>Body Language Insights</h3>
                         <p style={{ marginTop: '1rem', lineHeight: '1.6', color: '#cbd5e1' }}>
                             {feedbackData.body_language_feedback}
                         </p>
                    </Card>
                )}
            </div>

            <Card className="next-steps">
                    <h3>Recommended Next Steps</h3>
                <div className="next-steps-grid">
                    {nextSteps.map((step, index) => (
                        <div className="next-step-item" key={index}>
                            <div className="step-number">{index + 1}</div>
                            <div className="step-content">
                                <h4>Step {index + 1}</h4>
                                <p>{step}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            <div className="feedback-actions">
                <Button variant="secondary" onClick={() => navigate('/dashboard')}>
                    Back to Dashboard
                </Button>
                <Button variant="primary" size="large" onClick={() => navigate('/upload')}>
                    Practice Again
                </Button>
            </div>
        </div>
    );
};

export default Feedback;
