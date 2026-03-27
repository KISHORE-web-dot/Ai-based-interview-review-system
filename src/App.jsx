import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import ResumeUpload from './pages/ResumeUpload';
import Dashboard from './pages/Dashboard';
import InterviewSetup from './pages/InterviewSetup';
import LiveInterview from './pages/LiveInterview';
import Feedback from './pages/Feedback';
import Login from './pages/Login';
import Register from './pages/Register';
import './index.css';
import './styles/components.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    const location = useLocation();

    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

const App = () => {
    return (
        <Router>
            <div className="app-container">
                <Header />
                <main className="main-content">
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        {/* Initial Route - Check if logged in, else login */}
                        <Route path="/" element={<Navigate to="/login" replace />} />

                        {/* Protected Routes */}
                        <Route path="/upload" element={
                            <ProtectedRoute>
                                <ResumeUpload />
                            </ProtectedRoute>
                        } />

                        <Route path="/dashboard" element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        } />

                        <Route path="/setup" element={
                            <ProtectedRoute>
                                <InterviewSetup />
                            </ProtectedRoute>
                        } />

                        <Route path="/interview" element={
                            <ProtectedRoute>
                                <LiveInterview />
                            </ProtectedRoute>
                        } />

                        <Route path="/feedback" element={
                            <ProtectedRoute>
                                <Feedback />
                            </ProtectedRoute>
                        } />

                        {/* Catch all */}
                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
};

export default App;
