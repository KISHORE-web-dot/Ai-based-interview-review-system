import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Brain, LogOut, Sun, Moon } from 'lucide-react';
import '../styles/components.css';

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    const [isDarkMode, setIsDarkMode] = React.useState(() => {
        return localStorage.getItem('theme') === 'dark';
    });

    React.useEffect(() => {
        if (isDarkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    // Hide header content on auth pages if desired, or just show logo
    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

    return (
        <nav className="navbar">
            <div className="nav-content" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <Link to="/" className="logo">
                    <div className="logo-icon">
                        <Brain size={24} />
                    </div>
                    <span className="logo-text">InterviewIQ</span>
                </Link>

                {!isAuthPage && token && (
                    <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span className="user-name" style={{ fontWeight: 500 }}>Hello, {user}</span>
                        
                        <button
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className="btn btn-outline"
                            style={{ padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Toggle Theme"
                        >
                            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>

                        <button
                            onClick={handleLogout}
                            className="btn btn-outline"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
                        >
                            <LogOut size={16} /> Logout
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Header;
