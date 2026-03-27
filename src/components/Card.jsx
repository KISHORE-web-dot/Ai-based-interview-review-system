import React from 'react';
import '../styles/components.css';

const Card = ({ children, className = '', hover = true }) => {
    return (
        <div className={`card ${hover ? '' : 'no-hover'} ${className}`}>
            {children}
        </div>
    );
};

export default Card;
