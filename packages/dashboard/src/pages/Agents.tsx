import { useState, useEffect } from 'react';
import { Bot, RefreshCw, Save, Trash2, Settings, FileText, Wrench, Zap, Radio, Calendar, X, Plus } from 'lucide-react';
import { api, type AgentConfig } from '../services/api';
import './Agents.css';

type TabType = 'overview' | 'files' | 'tools' | 'skills' | 'channels' | 'cron';

export function Agents() {
    const [agents, setAgents] = useState<AgentConfig[]>([]);
    const [models, setModels] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAgentName, setSelectedAgentName] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('overview');

    // Edit Form State
    const [formData, setFormData] = useState<AgentConfig | null>(null);
    const [availableSkills, setAvailableSkills] = useState<{ native: any[], project: any[] }>({ native: [], project: [] });

    // Details State
    const [agentJobs, setAgentJobs] = useState<any[]>([]);
    const [agentMemory, setAgentMemory] = useState<any[]>([]);
    const [viewingJournal, setViewingJournal] = useState<{ name: string, content: string } | null>(null);
    const [isCreating, setIsCreating] = useState(false); // Used to show creation mode on the right panel

    const fetchAgents = async () => {
        try {
            setIsLoading(true);
            const data = await api.getAgents();
            setAgents(data);
            if (data.length > 0 && !selectedAgentName && !isCreating) {
                setSelectedAgentName(data[0].name);
            }
        } catch (err) {
            console.error('Failed to fetch agents', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchModels = async () => {
        try {
            const data = await api.getModels();
            setModels(data);
        } catch (err) {
            console.error('Failed to fetch models', err);
        }
    };

    const fetchSkills = async () => {
        try {
            const data = await api.getSkills();
            setAvailableSkills(data);
        } catch (err) {
            console.error('Failed to fetch skills', err);
        }
    };

    useEffect(() => {
        fetchAgents();
        fetchModels();
        fetchSkills();
    }, []);

    // Effect to update formData and fetch details when selected agent changes
    useEffect(() => {
        if (selectedAgentName) {
            const agent = agents.find(a => a.name === selectedAgentName);
            if (agent) {
                setFormData({ ...agent });
                fetchAgentDetails(agent.name);
                setIsCreating(false);
            }
        }
    }, [selectedAgentName, agents]);

    const fetchAgentDetails = async (name: string) => {
        try {
            const [jobs, memory] = await Promise.all([
                api.getAgentJobs(name),
                api.getAgentMemory(name)
            ]);
            setAgentJobs(jobs);
            setAgentMemory(memory);
        } catch (err) {
            console.error('Failed to fetch agent details', err);
        }
    };

    const handleCreateNew = () => {
        setSelectedAgentName(null);
        setIsCreating(true);
        setActiveTab('overview');
        setFormData({
            name: '',
            model: 'gemini-2.0-flash',
            modelCallback: '',
            fallbackModels: [],
            allowedPermissions: []
        });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData) return;
        try {
            if (isCreating) {
                await api.createAgent(formData);
                setIsCreating(false);
                setSelectedAgentName(formData.name);
            } else {
                await api.updateAgent(formData.name, formData);
            }
            fetchAgents();
            alert('Agent saved successfully!');
        } catch (err: any) {
            const msg = err.response?.data?.error || err.message || 'Failed to save agent';
            alert(`Error: ${msg}`);
        }
    };

    const handleDelete = async (name: string) => {
        if (!confirm(`Are you sure you want to delete agent "${name}"?`)) return;
        try {
            await api.deleteAgent(name);
            if (selectedAgentName === name) {
                setSelectedAgentName(null);
            }
            fetchAgents();
        } catch (err: any) {
            const msg = err.response?.data?.error || err.message || 'Failed to delete agent';
            alert(`Error: ${msg}`);
        }
    };

    const handleViewJournal = async (agentName: string, filename: string) => {
        try {
            const content = await api.getAgentMemoryContent(agentName, filename);
            setViewingJournal({ name: filename, content });
        } catch (err) {
            alert('Failed to load journal content');
        }
    };

    const removeJob = async (agentName: string, jobId: string) => {
        if (!confirm('Remove this scheduled task?')) return;
        try {
            await api.deleteAgentJob(agentName, jobId);
            const jobs = await api.getAgentJobs(agentName);
            setAgentJobs(jobs);
        } catch (err) {
            alert('Failed to remove job');
        }
    };

    const renderTabNavigation = () => (
        <div className="agent-tabs">
            <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                <Settings size={14} /> Overview
            </button>
            <button className={`tab-btn ${activeTab === 'files' ? 'active' : ''}`} onClick={() => setActiveTab('files')} disabled={isCreating}>
                <FileText size={14} /> Files
            </button>
            <button className={`tab-btn ${activeTab === 'tools' ? 'active' : ''}`} onClick={() => setActiveTab('tools')} disabled={isCreating}>
                <Wrench size={14} /> Tools
            </button>
            <button className={`tab-btn ${activeTab === 'skills' ? 'active' : ''}`} onClick={() => setActiveTab('skills')} disabled={isCreating}>
                <Zap size={14} /> Skills
            </button>
            <button className={`tab-btn ${activeTab === 'channels' ? 'active' : ''}`} onClick={() => setActiveTab('channels')} disabled={isCreating}>
                <Radio size={14} /> Channels
            </button>
            <button className={`tab-btn ${activeTab === 'cron' ? 'active' : ''}`} onClick={() => setActiveTab('cron')} disabled={isCreating}>
                <Calendar size={14} /> Cron Jobs
            </button>
        </div>
    );

    const renderOverviewTab = () => {
        if (!formData) return null;
        return (
            <div className="tab-content overview-tab animate-fade-in">
                <form onSubmit={handleSave} className="agent-form">
                    <div className="form-group flex justify-between items-center bg-darker p-3 rounded">
                        <div>
                            <label>Agent Name / Identity</label>
                            <input
                                type="text"
                                className="form-input invisible-input text-lg font-bold"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. coder-agent"
                                required
                                disabled={!isCreating} // Immutable après création
                            />
                        </div>
                        {!isCreating && (
                            <div className="agent-badge default-badge text-xs">DEFAULT</div>
                        )}
                    </div>

                    <div className="form-row split-form">
                        <div className="form-group">
                            <label>Primary Model</label>
                            <select
                                className="form-select"
                                value={formData.model}
                                onChange={e => setFormData({ ...formData, model: e.target.value })}
                                required
                            >
                                <option value="" disabled>Select a model</option>
                                {models.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Model Callback (Fallback #1)</label>
                            <select
                                className="form-select"
                                value={formData.modelCallback || ''}
                                onChange={e => setFormData({ ...formData, modelCallback: e.target.value })}
                            >
                                <option value="">No callback</option>
                                {models.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {!isCreating && (
                        <div className="form-group mt-2">
                            <label>Workspace Path</label>
                            <div className="code-block monospace text-sm">
                                {formData.baseDir || 'Not specified'}
                            </div>
                        </div>
                    )}

                    <div className="form-actions mt-6 flex justify-end gap-3">
                        <button type="button" className="btn btn-outline" onClick={() => fetchAgents()}>
                            <RefreshCw size={14} className="mr-1" /> Reload Config
                        </button>
                        <button type="submit" className="btn btn-primary">
                            <Save size={14} className="mr-1" /> {isCreating ? 'Create' : 'Save'} Configuration
                        </button>
                    </div>
                </form>
            </div>
        );
    };

    const renderFilesTab = () => (
        <div className="tab-content files-tab animate-fade-in">
            <p className="text-muted text-sm mb-4">View and edit the context journals and instructions for this agent.</p>
            <div className="journals-grid">
                {agentMemory.length > 0 ? agentMemory.map(file => (
                    <div key={file.name} className="journal-card glass-panel cursor-pointer" onClick={() => handleViewJournal(selectedAgentName!, file.name)}>
                        <div className="journal-icon">
                            <FileText size={24} className="text-primary" />
                        </div>
                        <div className="journal-info">
                            <h4>{file.name}</h4>
                            <span className="text-xs text-muted">{(file.size / 1024).toFixed(1)} KB</span>
                        </div>
                    </div>
                )) : <p className="text-muted text-sm">No files found in workspace.</p>}
            </div>
        </div>
    );

    const renderSkillsTab = () => {
        if (!formData) return null;
        return (
            <div className="tab-content skills-tab animate-fade-in">
                <p className="text-muted text-sm mb-4">Assign granular skills and tools to this agent instance.</p>
                <div className="skills-selectors-grid">
                    <div className="skill-category glass-panel p-4">
                        <h5 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>🛠️ Native (Gemini CLI)</h5>
                        <div className="checkbox-group mt-3">
                            {availableSkills.native.map(skill => (
                                <label key={skill.name} className="checkbox-label" title={skill.description}>
                                    <input
                                        type="checkbox"
                                        checked={formData.allowedPermissions?.includes(skill.name)}
                                        onChange={async (e) => {
                                            const perms = formData.allowedPermissions || [];
                                            const newPerms = e.target.checked ? [...perms, skill.name] : perms.filter(p => p !== skill.name);
                                            setFormData({ ...formData, allowedPermissions: newPerms });
                                            // Auto save on toggle
                                            await api.updateAgent(formData.name, { ...formData, allowedPermissions: newPerms });
                                            fetchAgents();
                                        }}
                                    />
                                    <span className="checkbox-text font-medium">{skill.name}</span>
                                    <span className="skill-desc truncate text-xs text-muted ml-2">{skill.description}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="skill-category glass-panel p-4">
                        <h5 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>🧩 Project Skills (Internal)</h5>
                        <div className="checkbox-group mt-3">
                            {availableSkills.project.map(skill => (
                                <label key={skill.name} className="checkbox-label" title={skill.description}>
                                    <input
                                        type="checkbox"
                                        checked={formData.allowedPermissions?.includes(skill.name)}
                                        onChange={async (e) => {
                                            const perms = formData.allowedPermissions || [];
                                            const newPerms = e.target.checked ? [...perms, skill.name] : perms.filter(p => p !== skill.name);
                                            setFormData({ ...formData, allowedPermissions: newPerms });
                                            // Auto save on toggle
                                            await api.updateAgent(formData.name, { ...formData, allowedPermissions: newPerms });
                                            fetchAgents();
                                        }}
                                    />
                                    <span className="checkbox-text font-medium">{skill.name}</span>
                                    <span className="skill-desc truncate text-xs text-muted ml-2">{skill.description}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderCronTab = () => (
        <div className="tab-content cron-tab animate-fade-in">
            <p className="text-muted text-sm mb-4">Scheduled jobs relying on this agent's identity.</p>
            <div className="jobs-list">
                {agentJobs.length > 0 ? agentJobs.map(job => (
                    <div key={job.id} className="job-item glass-panel flex justify-between items-center p-3 mb-2">
                        <div>
                            <code className="text-xs bg-dark px-2 py-1 rounded text-primary">{job.cron}</code>
                            <p className="text-sm mt-1">{job.prompt}</p>
                        </div>
                        <button className="icon-btn text-danger flex items-center gap-1" onClick={() => removeJob(selectedAgentName!, job.id)}>
                            <Trash2 size={14} /> Remove
                        </button>
                    </div>
                )) : <p className="text-muted text-sm italic">No active cron tasks assigned to this agent.</p>}
            </div>
        </div>
    );

    const renderPlaceholderTab = (name: string) => (
        <div className="tab-content placeholder-tab animate-fade-in flex flex-col items-center justify-center p-10 text-center">
            <div className="opacity-50 mb-3"><Bot size={48} /></div>
            <h3>{name} Configuration</h3>
            <p className="text-muted text-sm max-w-sm mt-2">This configuration panel is available but currently acts globally based on gateway rules.</p>
        </div>
    );

    return (
        <div className="page-container agents-page">
            <div className="agents-split-layout">
                {/* Left Column: Agent List */}
                <div className="agents-navigation glass-panel">
                    <div className="nav-header flex justify-between items-center p-3 border-b">
                        <span className="font-bold text-sm uppercase tracking-wider text-muted">Agents ({agents.length})</span>
                        <button className="icon-btn btn-primary" style={{ padding: '0.2rem' }} onClick={handleCreateNew} title="New Agent">
                            <Plus size={16} />
                        </button>
                    </div>
                    <div className="agents-list">
                        {isLoading ? (
                            <div className="flex justify-center p-4"><RefreshCw className="animate-spin text-primary" size={20} /></div>
                        ) : (
                            <>
                                {agents.map(agent => (
                                    <div
                                        key={agent.name}
                                        className={`agent-nav-item ${selectedAgentName === agent.name && !isCreating ? 'active' : ''}`}
                                        onClick={() => {
                                            setSelectedAgentName(agent.name);
                                            setIsCreating(false);
                                        }}
                                    >
                                        <div className="agent-avatar bg-primary-dim text-primary font-bold">
                                            {agent.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="agent-nav-info overflow-hidden">
                                            <h4 className="truncate">{agent.name}</h4>
                                            <span className="text-xs text-muted truncate">{agent.model}</span>
                                        </div>
                                        {agent.name === 'main' && <span className="text-[10px] bg-dark text-muted px-1 rounded uppercase font-bold ml-auto">Def</span>}
                                    </div>
                                ))}
                            </>
                        )}
                        {isCreating && (
                            <div className="agent-nav-item active creating">
                                <div className="agent-avatar bg-accent-dim text-accent"><Plus size={16} /></div>
                                <div className="agent-nav-info">
                                    <h4>New Agent</h4>
                                    <span className="text-xs text-muted">Unsaved</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Agent Details */}
                <div className="agent-details-panel glass-panel">
                    {(selectedAgentName || isCreating) ? (
                        <>
                            <div className="details-header p-4 border-b flex justify-between items-end bg-darker">
                                <div>
                                    <h2 className="text-2xl font-bold mb-1">
                                        {isCreating ? 'Create New Agent' : selectedAgentName}
                                    </h2>
                                    <p className="text-sm text-muted m-0">
                                        {isCreating ? 'Configure identity and basic routing.' : 'Agent workspace and routing configuration.'}
                                    </p>
                                </div>
                                {!isCreating && selectedAgentName && (
                                    <button className="icon-btn text-danger flex items-center gap-1 text-sm bg-dark px-2 py-1 rounded hover-bg-danger hover-text-white transition" onClick={() => handleDelete(selectedAgentName)}>
                                        <Trash2 size={14} /> Delete Agent
                                    </button>
                                )}
                            </div>

                            {renderTabNavigation()}

                            <div className="details-content-area p-5">
                                {activeTab === 'overview' && renderOverviewTab()}
                                {activeTab === 'files' && renderFilesTab()}
                                {activeTab === 'tools' && renderPlaceholderTab('Tools & Capabilities')}
                                {activeTab === 'skills' && renderSkillsTab()}
                                {activeTab === 'channels' && renderPlaceholderTab('Routing Channels')}
                                {activeTab === 'cron' && renderCronTab()}
                            </div>
                        </>
                    ) : (
                        <div className="empty-state flex flex-col items-center justify-center h-full text-center text-muted p-10">
                            <Bot size={64} className="mb-4 opacity-20" />
                            <h3>No Agent Selected</h3>
                            <p className="text-sm max-w-sm mt-2">Select an agent from the list to view and edit its configuration, or create a new one.</p>
                        </div>
                    )}
                </div>
            </div>

            {viewingJournal && (
                <div className="modal-overlay z-50">
                    <div className="modal-content glass-panel" style={{ maxWidth: '800px', width: '90%' }}>
                        <div className="modal-header">
                            <h2>Journal: {viewingJournal.name}</h2>
                            <button className="close-btn" onClick={() => setViewingJournal(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body bg-dark" style={{ maxHeight: '70vh', overflowY: 'auto', padding: '1rem' }}>
                            <pre className="text-sm monospace whitespace-pre-wrap text-muted">{viewingJournal.content}</pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
