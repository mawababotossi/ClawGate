import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Search, Activity } from 'lucide-react';
import { api } from '../services/api';
import { navGroups } from './Sidebar';
import './TopBar.css';

export function TopBar() {
    const [isConnected, setIsConnected] = useState(false);
    const { pathname } = useLocation();

    // Find current page title
    const currentPage = navGroups
        .flatMap(g => g.items)
        .find(item => item.path === pathname || (item.path !== '/' && pathname.startsWith(item.path)));

    const pageTitle = currentPage?.label ?? 'Dashboard';

    useEffect(() => {
        let mounted = true;
        const checkStatus = async () => {
            try {
                await api.getStatus();
                if (mounted) setIsConnected(true);
            } catch {
                if (mounted) setIsConnected(false);
            }
        };
        checkStatus();
        const interval = setInterval(checkStatus, 3000);
        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, []);

    return (
        <header className="topbar">
            <div className="topbar-left">
                <h1 className="page-context-title">{pageTitle}</h1>
            </div>

            <div className="search-bar glass-card">
                <Search size={18} className="search-icon" />
                <input type="text" placeholder="Search sessions, agents..." />
            </div>

            <div className="topbar-actions">
                <div className={`gateway-health ${isConnected ? 'healthy' : 'error'}`}>
                    <Activity size={14} />
                    <span>Gateway: {isConnected ? 'Online' : 'Offline'}</span>
                </div>

                <button className="icon-btn glass-card">
                    <Bell size={18} />
                    <span className="notification-badge"></span>
                </button>

                <div className="user-profile glass-card">
                    <div className="avatar">A</div>
                    <span>Admin</span>
                </div>
            </div>
        </header>
    );
}
