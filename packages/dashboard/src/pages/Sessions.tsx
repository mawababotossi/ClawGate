import { useState, useEffect } from 'react';
import { RefreshCw, Search, Construction } from 'lucide-react';
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

import { PageHeader } from '../components/PageHeader';

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
        <div className="page-container sessions-page">
            <PageHeader
                title="Active Sessions"
                description="Live session monitoring and conversation history across all agents."
                actions={
                    <button className="btn btn-outline" onClick={loadSessions} disabled={loading}>
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        Sync Sessions
                    </button>
                }
            />

            <div className="sessions-filters glass-panel p-4">
                <div className="flex flex-wrap items-center gap-6">
                    <div className="filter-group">
                        <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">Active within</label>
                        <select value={activeWithin} onChange={(e) => setActiveWithin(e.target.value)} className="glass-input">
                            <option value="All">All time</option>
                            <option value="1h">Last 1 hour</option>
                            <option value="24h">Last 24 hours</option>
                            <option value="7d">Last 7 days</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">Max Results</label>
                        <select value={limit} onChange={(e) => setLimit(e.target.value)} className="glass-input">
                            <option value="50">50</option>
                            <option value="100">100</option>
                            <option value="500">500</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                        <label className="checkbox-label flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={includeGlobal}
                                onChange={(e) => setIncludeGlobal(e.target.checked)}
                                className="accent-primary"
                            />
                            <span className="text-sm">Include global</span>
                        </label>
                        <label className="checkbox-label flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={includeUnknown}
                                onChange={(e) => setIncludeUnknown(e.target.checked)}
                                className="accent-primary"
                            />
                            <span className="text-sm">Include unknown</span>
                        </label>
                    </div>

                    <div className="ml-auto relative min-w-[240px]">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                            type="text"
                            placeholder="Search sessions..."
                            className="glass-input w-full pl-9"
                        />
                    </div>
                </div>
            </div>

            <div className="sessions-table-container glass-panel overflow-hidden">
                {error ? (
                    <div className="sessions-error p-12 text-center">
                        <p className="text-danger font-medium">{error}</p>
                        <button className="btn btn-ghost mt-4" onClick={loadSessions}>Retry Connection</button>
                    </div>
                ) : (
                    <table className="sessions-table w-full">
                        <thead>
                            <tr>
                                <th className="text-left font-bold text-xs uppercase tracking-wider p-4 border-b">Session ID</th>
                                <th className="text-left font-bold text-xs uppercase tracking-wider p-4 border-b">Owner / Label</th>
                                <th className="text-left font-bold text-xs uppercase tracking-wider p-4 border-b">Kind</th>
                                <th className="text-left font-bold text-xs uppercase tracking-wider p-4 border-b">Updated</th>
                                <th className="text-left font-bold text-xs uppercase tracking-wider p-4 border-b">Usage</th>
                                <th className="text-center font-bold text-xs uppercase tracking-wider p-4 border-b">Status</th>
                                <th className="text-center font-bold text-xs uppercase tracking-wider p-4 border-b">Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && sessions.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center p-12">
                                        <RefreshCw className="animate-spin text-primary mx-auto mb-2" size={24} />
                                        <p className="text-muted">Loading session data...</p>
                                    </td>
                                </tr>
                            ) : sessions.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center p-12">
                                        <div className="opacity-30 mb-2">
                                            <Construction size={48} className="mx-auto" />
                                        </div>
                                        <p className="text-muted">No active sessions found.</p>
                                    </td>
                                </tr>
                            ) : (
                                sessions.map((session) => (
                                    <tr key={session.key} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4 border-b">
                                            <code className="text-xs text-primary opacity-80">{session.key.substring(0, 12)}...</code>
                                        </td>
                                        <td className="p-4 border-b">
                                            <div className="font-semibold">{session.label || 'Unnamed Session'}</div>
                                            <div className="text-xs text-muted truncate max-w-[200px]">{session.key}</div>
                                        </td>
                                        <td className="p-4 border-b">
                                            <span className="badge-bool uppercase" style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)' }}>
                                                {session.kind}
                                            </span>
                                        </td>
                                        <td className="p-4 border-b text-sm text-muted">
                                            {formatTimeAgo(session.updated)}
                                        </td>
                                        <td className="p-4 border-b">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex justify-between text-[0.65rem] font-bold text-muted uppercase">
                                                    <span>Tokens</span>
                                                    <span>{session.tokens}</span>
                                                </div>
                                                <div className="token-bar-container h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        className="token-bar-fill h-full bg-gradient-to-r from-primary to-secondary opacity-60"
                                                        style={{ width: `${Math.min((session.tokens / 8000) * 100, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 border-b text-center">
                                            {session.thinking ? (
                                                <span className="badge-bool bg-success/10 text-success">Active</span>
                                            ) : (
                                                <span className="badge-bool bg-white/5 text-muted">Idle</span>
                                            )}
                                        </td>
                                        <td className="p-4 border-b">
                                            <div className="flex justify-center gap-2">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[0.6rem] font-bold text-muted uppercase">Actions</span>
                                                    <span className="font-mono text-xs">{session.actions || 0}</span>
                                                </div>
                                                <div className="w-[1px] h-6 bg-white/10 mx-1"></div>
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[0.6rem] font-bold text-muted uppercase">Verb</span>
                                                    <span className="font-mono text-xs">{session.verbose || 0}</span>
                                                </div>
                                            </div>
                                        </td>
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
