import { useState, useEffect } from 'react';
import { Server, Clock, Hash, Globe, Link2, ListTree } from 'lucide-react';
import { api, type AppStatus } from '../services/api';
import './Dashboard.css';

function formatUptime(seconds?: number) {
    if (!seconds) return '0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

function formatRelativeTime(ms?: number) {
    if (!ms) return 'never';
    const diff = Date.now() - ms;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ago`;
}

export function Dashboard() {
    const [statusInfo, setStatusInfo] = useState<AppStatus | null>(null);
    const [wsUrl, setWsUrl] = useState(`ws://${window.location.hostname}:3002`);
    const [token, setToken] = useState('****************');

    const fetchStatus = () => {
        api.getStatus().then(setStatusInfo).catch(console.error);
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="page-container overview-page">
            <div className="overview-grid-top">
                {/* Gateway Access Panel */}
                <div className="glass-panel gateway-access">
                    <div className="panel-header">
                        <Globe size={18} />
                        <h3>Gateway Access</h3>
                    </div>
                    <div className="panel-content access-form">
                        <div className="input-row">
                            <div className="input-group">
                                <label>WebSocket URL</label>
                                <input type="text" value={wsUrl} onChange={e => setWsUrl(e.target.value)} />
                            </div>
                        </div>
                        <div className="input-row split">
                            <div className="input-group">
                                <label>Gateway Token</label>
                                <input type="password" value={token} onChange={e => setToken(e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label>Password (optional)</label>
                                <input type="password" placeholder="Leave blank if unencrypted" disabled />
                            </div>
                        </div>
                        <div className="input-row split">
                            <div className="input-group">
                                <label>Default Session Key</label>
                                <input type="text" placeholder="e.g. agent:main:webchat" disabled />
                            </div>
                            <div className="input-group">
                                <label>Language</label>
                                <select disabled>
                                    <option>English (US)</option>
                                    <option>French (FR)</option>
                                </select>
                            </div>
                        </div>
                        <div className="actions-row">
                            <button className="btn btn-primary" disabled>
                                <Link2 size={16} /> Connect
                            </button>
                            <button className="btn btn-outline" onClick={fetchStatus}>
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {/* Snapshot Panel */}
                <div className="glass-panel gateway-snapshot">
                    <div className="panel-header">
                        <Server size={18} />
                        <h3>Snapshot</h3>
                    </div>
                    <div className="panel-content snapshot-stats">
                        <div className="snapshot-item">
                            <span className="label">STATUS</span>
                            <span className="value status-ok">
                                {statusInfo?.status === 'Healthy' ? 'OK' : (statusInfo?.status || 'Unknown')}
                            </span>
                        </div>
                        <div className="snapshot-item">
                            <span className="label">UPTIME</span>
                            <span className="value">{formatUptime(statusInfo?.uptime)}</span>
                        </div>
                        <div className="snapshot-item">
                            <span className="label">TICK I.</span>
                            <span className="value">{statusInfo?.tickInterval || 60}m</span>
                        </div>
                        <div className="snapshot-item">
                            <span className="label">LAST REFRESH</span>
                            <span className="value">{formatRelativeTime(statusInfo?.lastChannelsRefresh)}</span>
                        </div>
                        <div className="snapshot-item">
                            <span className="label">AUTH</span>
                            <span className="value">{statusInfo?.authType || 'None'}</span>
                        </div>

                        <div className="snapshot-footer">
                            <p>Connect the dashboard to the WebSocket to enable active monitoring.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Counters Grid */}
            <div className="overview-counters">
                <div className="glass-panel counter-card">
                    <div className="counter-header">
                        <Server size={20} className="text-primary" />
                        <span>INSTANCES</span>
                    </div>
                    <div className="counter-value">{statusInfo?.instances || 0}</div>
                    <div className="counter-desc">Connected WebSocket clients routing traffic.</div>
                </div>

                <div className="glass-panel counter-card">
                    <div className="counter-header">
                        <ListTree size={20} className="text-primary" />
                        <span>SESSIONS</span>
                    </div>
                    <div className="counter-value">{statusInfo?.sessions || 0}</div>
                    <div className="counter-desc">Active contextual chat memory buffers.</div>
                </div>

                <div className="glass-panel counter-card">
                    <div className="counter-header">
                        <Clock size={20} className="text-primary" />
                        <span>CRON</span>
                    </div>
                    <div className="counter-value">{statusInfo?.cron || 0}</div>
                    <div className="counter-desc">Agents with scheduled heartbeat logic.</div>
                </div>
            </div>

            {/* Notes Section */}
            <div className="glass-panel operator-notes">
                <div className="notes-header">
                    <Hash size={18} />
                    <span>Operator Notes</span>
                </div>
                <div className="notes-content">
                    <div className="note-card">
                        <h4>Secure Access</h4>
                        <p>If reaching the gateway over the internet, ensure you are using Tailscale or a proper reverse proxy with SSL termination. Do not expose port 3002 natively.</p>
                    </div>
                    <div className="note-card">
                        <h4>Session Hygiene</h4>
                        <p>Tokens accumulate over time for long-running sessions. Use the Sessions tab to monitor limits and clear stale contexts to save LLM costs.</p>
                    </div>
                    <div className="note-card">
                        <h4>Cron Reminders</h4>
                        <p>Cron jobs will only execute if the agent's primary model is responsive. Jobs on unverified or unstable models will fail silently.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
