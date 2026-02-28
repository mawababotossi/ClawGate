import React from 'react';
import { PageHeader } from '../components/PageHeader';
import { Bot, Construction } from 'lucide-react';

interface ComingSoonProps {
    title: string;
    description: string;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ title, description }) => {
    return (
        <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <PageHeader
                title={title}
                description={description}
            />

            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                gap: '1.5rem',
                opacity: 0.8
            }}>
                <div style={{ position: 'relative' }}>
                    <Bot size={80} style={{ opacity: 0.1 }} />
                    <Construction size={32} style={{
                        position: 'absolute',
                        bottom: -5,
                        right: -5,
                        color: 'var(--warning)',
                        background: 'var(--bg-dark)',
                        borderRadius: '50%',
                        padding: '4px'
                    }} />
                </div>
                <div style={{ textAlign: 'center' }}>
                    <h3 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Feature Under Development</h3>
                    <p style={{ maxWidth: '400px', fontSize: 'var(--text-sm)' }}>
                        We are currently building this module to provide deeper insights into your OpenClaw ecosystem. Stay tuned!
                    </p>
                </div>
                <button className="btn btn-outline" onClick={() => window.history.back()}>
                    Go Back
                </button>
            </div>
        </div>
    );
};
