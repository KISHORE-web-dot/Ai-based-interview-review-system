import React, { useState } from 'react';
import { Upload, CheckCircle } from 'lucide-react';
import Button from './Button';
import './FileUpload.css';

const FileUpload = ({ onFileSelect }) => {
    const [dragOver, setDragOver] = useState(false);
    const [fileName, setFileName] = useState('');

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    };

    const handleFileInput = (e) => {
        const files = e.target.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    };

    const handleFile = (file) => {
        const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (validTypes.includes(file.type)) {
            setFileName(file.name);
            if (onFileSelect) {
                onFileSelect(file);
            }
        } else {
            alert('Please upload a PDF or DOCX file');
        }
    };

    return (
        <div
            className={`upload-zone ${dragOver ? 'drag-over' : ''} ${fileName ? 'has-file' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input').click()}
        >
            <input
                id="file-input"
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileInput}
                style={{ display: 'none' }}
            />

            {fileName ? (
                <>
                    <div className="upload-icon success">
                        <CheckCircle size={32} />
                    </div>
                    <p className="upload-text">{fileName}</p>
                    <p className="upload-hint">Click to change file</p>
                </>
            ) : (
                <>
                    <div className="upload-icon">
                        <Upload size={32} />
                    </div>
                    <p className="upload-text">Drag & drop your resume here</p>
                    <p className="upload-hint">or click to browse • PDF or DOCX • Max 5MB</p>
                </>
            )}
        </div>
    );
};

export default FileUpload;
