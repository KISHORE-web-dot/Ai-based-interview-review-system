import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import { api } from '../services/api';
import './Auth.css';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '', // OAuth2 expects 'username' (which is email here)
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await api.login(formData.username, formData.password);
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', data.user_name);
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to login. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <Card className="auth-card">
                <div className="auth-header">
                    <h2>Welcome Back</h2>
                    <p>Sign in to continue your preparation</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label>Email Address</label>
                        <div className="input-with-icon">
                            <Mail size={18} />
                            <input
                                type="email"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="Enter your email"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <div className="input-with-icon">
                            <Lock size={18} />
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                required
                            />
                        </div>
                    </div>

                    <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                        {loading ? 'Signing In...' : 'Sign In'} <LogIn size={18} />
                    </Button>
                </form>

                <div className="auth-footer">
                    <p>Don't have an account? <Link to="/register">Create Account</Link></p>
                </div>
            </Card>
        </div>
    );
};

export default Login;
