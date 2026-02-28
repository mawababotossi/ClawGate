import { useState, useEffect } from 'react';
import { RefreshCw, Search, Filter } from 'lucide-react';
import { api } from '../services/api';
import './Sessions.css';

interface SessionData {
    key: string;
    label: string;
    kind: string;
    updated: number;
    tokens: number;
    thinking: boolean;
    verbose: number;
    reasoning: number;
    actions: number;
}

export function Sessions() {
    const [sessions, setSessions] = useState<SessionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters state
    const [activeWithin, setActiveWithin] = useState('All');
    const [limit, setLimit] = useState('100');
    const [includeGlobal, setIncludeGlobal] = useState(false);
    const [includeUnknown, setIncludeUnknown] = useState(false);

    const loadSessions = async () => {
        setLoading(true);
        try {
            const data = await api.getSessions();
            setSessions(data);
            setError(null);
        } catch (err: any) {
            console.error('Failed to load sessions:', err);
            setError('Could not load sessions. Make sure the gateway is running.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSessions();
    }, []);

    const formatTimeAgo = (timestamp: number) => {
        const diff = Date.now() - timestamp;
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return `${Math.floor(diff / 86400000)}d ago`;
    };

    return (
        <div className="sessions-page">
            <div className="sessions-header">
                <div className="sessions-title">
                    <h1>Sessions</h1>
                    <p>Live session monitoring and conversation history.</p>
                </div>
                <div className="sessions-actions">
                    <button className="btn btn-outline" onClick={loadSessions} disabled={loading}>
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            <div className="sessions-filters glass-panel">
                <div className="filter-group">
                    <label>Active within</label>
                    <select value={activeWithin} onChange={(e) => setActiveWithin(e.target.value)} className="glass-input">
                        <option value="All">All time</option>
                        <option value="1h">Last 1 hour</option>
                        <option value="24h">Last 24 hours</option>
                        <option value="7d">Last 7 days</option>
                    </select>
                </div>
                <div className="filter-group">
                    <label>Limit</label>
                    <select value={limit} onChange={(e) => setLimit(e.target.value)} className="glass-input">
                        <option value="50">50</option>
                        <option value="100">100</option>
                        <option value="500">500</option>
                    </select>
                </div>
                <div className="filter-checkboxes">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={includeGlobal}
                            onChange={(e) => setIncludeGlobal(e.target.checked)}
                        />
                        <span className="checkbox-text">Include global</span>
                    </label>
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={includeUnknown}
                            onChange={(e) => setIncludeUnknown(e.target.checked)}
                        />
                        <span className="checkbox-text">Include unknown</span>
                    </label>
                </div>
                <div className="filter-search ml-auto">
                    <Search size={16} className="text-muted" />
                    <input type="text" placeholder="Search sessions..." className="glass-input" />
                </div>
            </div>

            <div className="sessions-table-container glass-panel">
                {error ? (
                    <div className="sessions-error p-8 text-center text-danger">
                        {error}
                    </div>
                ) : (
                    <table className="sessions-table">
                        <thead>
                            <tr>
                                <th>KEY</th>
                                <th>LABEL</th>
                                <th>KIND</th>
                                <th>UPDATED</th>
                                <th>TOKENS</th>
                                <th>THINKING</th>
                                <th>VERBOSE</th>
                                <th>REASONING</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && sessions.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center p-8 text-muted">
                                        Loading sessions...
                                    </td>
                                </tr>
                            ) : sessions.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center p-8 text-muted">
                                        No active sessions found.
                                    </td>
                                </tr>
                            ) : (
                                sessions.map((session) => (
                                    <tr key={session.key}>
                                        <td className="font-mono text-muted text-xs">{session.key}</td>
                                        <td className="font-medium">{session.label}</td>
                                        <td>
                                            <span className="badge badge-outline uppercase">{session.kind}</span>
                                        </td>
                                        <td className="text-muted">{formatTimeAgo(session.updated)}</td>
                                        <td>
                                            <div className="token-bar-container">
                                                <div className="token-bar-fill" style={{ width: `${Math.min((session.tokens / 8000) * 100, 100)}%` }}></div>
                                                <span className="token-text">{session.tokens > 1000 ? (session.tokens / 1000).toFixed(1) + 'k' : session.tokens}</span>
                                            </div>
                                        </td>
                                        <td className="text-center">{session.thinking ? '✓' : '-'}</td>
                                        <td className="text-center">{session.verbose || '-'}</td>
                                        <td className="text-center">{session.reasoning || '-'}</td>
                                        <td className="text-center">{session.actions || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
