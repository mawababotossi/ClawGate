import React from 'react';
import './PageHeader.css';

interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
    return (
        <div className="page-header">
            <div className="header-info">
                <h1 className="header-title">{title}</h1>
                {description && <p className="header-description">{description}</p>}
            </div>
            {actions && <div className="header-actions">{actions}</div>}
        </div>
    );
}
