import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { PageHeader, EmptyState } from '../components';
import { MessagesSquare, Hash, User, RefreshCw, Clock } from 'lucide-react';
import './MessageBoard.css';

interface BoardMessage {
    id: string;
    channel: string;
    from: string;
    text: string;
    timestamp: number;
    replyTo?: string;
}

export function MessageBoard() {
    const [channels, setChannels] = useState<string[]>([]);
    const [activeChannel, setActiveChannel] = useState<string>('general');
    const [messages, setMessages] = useState<BoardMessage[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            const chans = await api.getBoardChannels();
            setChannels(chans.length > 0 ? chans : ['general']);
            if (chans.length > 0 && !chans.includes(activeChannel)) {
                setActiveChannel(chans[0]);
            }
        } catch (error) {
            console.error('Failed to load channels', error);
        }
        setLoading(false);
    };

    const loadMessages = async () => {
        if (!activeChannel) return;
        try {
            const msgs = await api.getBoardMessages(activeChannel, 100);
            setMessages(msgs);
        } catch (error) {
            console.error('Failed to load messages', error);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        loadMessages();
        const interval = setInterval(loadMessages, 5000);
        return () => clearInterval(interval);
    }, [activeChannel]);

    const formatTime = (ts: number) => {
        return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (ts: number) => {
        return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <div className="page-container message-board-page">
            <PageHeader
                title="Message Board"
                description="Inter-agent communication and broadcasts."
                actions={
                    <button className="btn btn-outline btn-sm" onClick={() => { loadData(); loadMessages(); }}>
                        <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
                    </button>
                }
            />

            <div className="board-layout">
                <div className="glass-panel channels-sidebar">
                    <div className="panel-header">
                        <h3>Channels</h3>
                    </div>
                    <div className="channels-list">
                        {channels.length === 0 ? (
                            <div className="p-4 text-muted text-sm text-center">No active channels</div>
                        ) : (
                            channels.map(ch => (
                                <div
                                    key={ch}
                                    className={`channel-item ${activeChannel === ch ? 'active' : ''}`}
                                    onClick={() => setActiveChannel(ch)}
                                >
                                    <Hash size={16} />
                                    <span>{ch}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="glass-panel messages-main">
                    <div className="panel-header">
                        <div className="flex items-center gap-2">
                            <Hash size={20} className="text-primary" />
                            <h3>{activeChannel}</h3>
                        </div>
                    </div>

                    <div className="messages-container">
                        {messages.length === 0 ? (
                            <EmptyState
                                icon={MessagesSquare}
                                title="No messages yet"
                                description={`There are no messages in #${activeChannel} yet. Agents will post here during their tasks or heartbeats.`}
                            />
                        ) : (
                            <div className="messages-list">
                                {messages.map((msg, idx) => {
                                    const showDate = idx === 0 || new Date(messages[idx - 1].timestamp).toDateString() !== new Date(msg.timestamp).toDateString();
                                    return (
                                        <div key={msg.id} className="message-group">
                                            {showDate && (
                                                <div className="message-date-divider">
                                                    <span>{formatDate(msg.timestamp)}</span>
                                                </div>
                                            )}
                                            <div className="message-item">
                                                <div className="message-avatar">
                                                    <User size={18} />
                                                </div>
                                                <div className="message-content">
                                                    <div className="message-header">
                                                        <span className="message-author">{msg.from}</span>
                                                        <span className="message-time">
                                                            <Clock size={12} /> {formatTime(msg.timestamp)}
                                                        </span>
                                                    </div>
                                                    <div className="message-text">
                                                        {msg.text}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
