import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, RefreshCw, LogOut } from 'lucide-react';
import './Channels.css';

export function Channels() {
    const [waStatus, setWaStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchStatus = async () => {
        try {
            const res = await fetch(`http://${window.location.hostname}:3002/api/channels/whatsapp/status`);
            const data = await res.json();
            setWaStatus(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 3000); // poll every 3s
        return () => clearInterval(interval);
    }, []);

    const handleLogout = async () => {
        try {
            await fetch(`http://${window.location.hostname}:3002/api/channels/whatsapp/logout`, { method: 'POST' });
            fetchStatus();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Channels & Integrations</h1>
                <p>Manage external messaging platforms like WhatsApp and Telegram.</p>
            </div>

            <div className="channels-grid">
                <div className="glass-panel channel-card">
                    <div className="channel-header">
                        <Smartphone size={24} className="text-success" />
                        <h3>WhatsApp Adapter</h3>
                    </div>

                    <div className="channel-content">
                        {loading ? (
                            <p>Loading status...</p>
                        ) : waStatus?.status === 'disabled' ? (
                            <p>WhatsApp channel is not enabled in backend config. Please enable it in <br /><code>geminiclaw.json</code>.</p>
                        ) : waStatus?.status === 'connected' ? (
                            <div className="status-connected">
                                <p className="text-success" style={{ marginBottom: "1rem" }}>✅ Connected and Active</p>
                                <button className="btn btn-outline" onClick={handleLogout}>
                                    <LogOut size={16} style={{ display: "inline-block", marginRight: "0.5rem", verticalAlign: "middle" }} />
                                    <span style={{ verticalAlign: "middle" }}>Disconnect Session</span>
                                </button>
                            </div>
                        ) : waStatus?.status === 'qr' && waStatus?.qr ? (
                            <div className="qr-container">
                                <p>Scan this QR Code with your mobile WhatsApp to link devices.</p>
                                <div className="qr-box">
                                    <QRCodeSVG value={waStatus.qr} size={256} />
                                </div>
                                <button className="btn btn-primary mt-4" onClick={fetchStatus}>
                                    <RefreshCw size={16} style={{ display: "inline-block", marginRight: "0.5rem", verticalAlign: "middle" }} />
                                    <span style={{ verticalAlign: "middle" }}>Refresh QR</span>
                                </button>
                            </div>
                        ) : (
                            <div className="status-waiting">
                                <p>Status: {waStatus?.status || 'Unknown'}</p>
                                <p className="text-secondary" style={{ marginBottom: "1rem" }}>Waiting for connection...</p>
                                <button className="btn btn-outline mt-4" onClick={handleLogout}>
                                    Force Reset
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
