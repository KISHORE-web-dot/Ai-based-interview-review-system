import React from 'react';
import '../styles/components.css';

const Button = ({
    children,
    variant = 'primary',
    size = 'medium',
    onClick,
    type = 'button',
    disabled = false,
    className = ''
}) => {
    const variantClass = `btn-${variant}`;
    const sizeClass = size === 'large' ? 'btn-large' : '';

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`btn ${variantClass} ${sizeClass} ${className}`}
        >
            {children}
        </button>
    );
};

export default Button;
