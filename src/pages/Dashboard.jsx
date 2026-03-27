import { api } from '../services/api';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Users, Target, TrendingUp, Brain, BarChart3, Clock, Loader2 } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import './Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [statsData, setStatsData] = useState({
        totalInterviews: 0,
        scores: {
            confidence: 0,
            communication: 0,
            technical: 0,
            stress: 0
        },
        trends: {
            confidence: '+0%',
            communication: '+0%'
        }
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await api.getDashboardStats();
                setStatsData(data);
            } catch (error) {
                console.error("Failed to fetch dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const actions = [
        {
            id: 'voice',
            icon: <Mic size={24} />,
            title: 'Voice Interview',
            description: 'One-on-one AI interview focusing on communication skills and technical knowledge',
            color: 'primary'
        },
        {
            id: 'panel',
            icon: <Users size={24} />,
            title: 'Panel Interview',
            description: 'Multi-interviewer simulation with HR, Technical, and Manager perspectives',
            color: 'accent'
        },
        {
            id: 'stress',
            icon: <Target size={24} />,
            title: 'Stress Practice',
            description: 'High-pressure scenarios to build confidence and improve performance under stress',
            color: 'warning'
        }
    ];

    const stats = [
        { label: 'Confidence Score', value: statsData.scores.confidence, trend: statsData.trends.confidence, icon: <Brain size={20} /> },
        { label: 'Communication Score', value: statsData.scores.communication, trend: statsData.trends.communication, icon: <BarChart3 size={20} /> },
        { label: 'Technical Score', value: statsData.scores.technical, trend: '', icon: <TrendingUp size={20} /> },
        { label: 'Interviews Taken', value: statsData.totalInterviews, trend: '', icon: <Clock size={20} /> }
    ];

    const handleActionClick = (actionId) => {
        if (actionId === 'upload') {
            navigate('/upload');
        } else {
            // Navigate directly to resume upload and pass the desired interview type
            navigate('/upload', { state: { interviewType: actionId } });
        }
    };

    if (loading) {
        return (
            <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <div style={{ textAlign: 'center' }}>
                    <Loader2 size={48} className="animate-spin" style={{ margin: '0 auto 1rem' }} />
                    <p>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Welcome Back</h1>
                <p>Choose your interview practice mode and continue improving your skills</p>
            </div>

            <div className="dashboard-grid">
                {actions.map((action) => (
                    <div
                        key={action.id}
                        className={`action-card action-card-${action.color}`}
                        onClick={() => handleActionClick(action.id)}
                    >
                        <div className="action-icon">
                            {action.icon}
                        </div>
                        <h3>{action.title}</h3>
                        <p>{action.description}</p>
                        <Button variant="primary" className="action-button">
                            Start Practice
                        </Button>
                    </div>
                ))}
            </div>

            <div className="performance-section">
                <div className="section-header">
                    <h2>Performance Overview</h2>
                    <p className="section-subtitle">Your progress over the last 30 days</p>
                </div>

                <div className="stats-grid">
                    {stats.map((stat, index) => (
                        <Card key={index} className="stat-card">
                            <div className="stat-icon">{stat.icon}</div>
                            <div className="stat-label">{stat.label}</div>
                            <div className="stat-value">{stat.value}{stat.label.includes('Score') || stat.label !== 'Interviews Taken' ? '%' : ''}</div>
                            {stat.trend && (
                                <div className="stat-trend">
                                    <TrendingUp size={14} />
                                    {stat.trend}
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
