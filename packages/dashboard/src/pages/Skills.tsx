/**
 * @license Apache-2.0
 * ClawGate Dashboard — Skills Page (Refonte v2 — Flat & Aligned Edition)
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import type { AgentConfig, SkillManifest, InstallStep } from '../services/api';
import {
    RefreshCw, Wrench, Terminal, Puzzle,
    CheckCircle2, AlertCircle, XCircle,
    Settings, X, Save,
    Power, PowerOff, Download, Search, Bot, Link
} from 'lucide-react';
import './Skills.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const KIND_META: Record<SkillManifest['kind'], { label: string; icon: React.ReactNode; color: string }> = {
    native: { label: 'Native', icon: <Wrench size={11} />, color: 'var(--primary)' },
    mcp: { label: 'MCP', icon: <Puzzle size={11} />, color: 'var(--accent)' },
    prompt: { label: 'Prompt', icon: <Terminal size={11} />, color: '#a78bfa' },
};

const STATUS_META: Record<SkillManifest['status'], { label: string; color: string; icon: React.ReactNode }> = {
    enabled: { label: 'Eligible', color: 'var(--success)', icon: <CheckCircle2 size={12} /> },
    disabled: { label: 'Blocked', color: 'var(--danger)', icon: <XCircle size={12} /> },
    'needs-config': { label: 'Needs Config', color: 'var(--warning)', icon: <AlertCircle size={12} /> },
    'needs-install': { label: 'Needs Install', color: '#f97316', icon: <Download size={12} /> },
};

function kindIcon(kind: SkillManifest['kind']) {
    const m = KIND_META[kind];
    return (
        <span className="skill-kind-badge" style={{ '--kind-color': m.color } as any}>
            {m.icon}
            {m.label}
        </span>
    );
}

function statusBadge(status: SkillManifest['status']) {
    const m = STATUS_META[status];
    return (
        <span className="skill-status-badge" style={{ '--status-color': m.color } as any}>
            {m.icon}
            {m.label}
        </span>
    );
}

function installStepToCommand(step: InstallStep): string {
    if (step.command) return step.command;
    if (step.kind === 'brew') return `brew install ${step.formula || step.id}`;
    if (step.kind === 'node') return `npm install -g ${step.module || step.package || step.id}`;
    if (step.kind === 'pip') return `pip install ${step.package || step.id}`;
    if (step.kind === 'go') return `go install ${step.module}@latest`;
    return "";
}

// ─── Skill Row ────────────────────────────────────────────────────────────────

interface SkillRowProps {
    skill: SkillManifest;
    selectedAgent: string | null;
    onConfigure: (skill: SkillManifest) => void;
    onInstall: (name: string) => void;
    onToggleDisable: (name: string, currentlyDisabled: boolean) => void;
    onToggleAssign: (skillName: string, agentName: string, currentlyAssigned: boolean) => Promise<void>;
    isInstalling: boolean;
}

function SkillRow({
    skill, selectedAgent, onConfigure, onInstall,
    onToggleDisable, onToggleAssign, isInstalling
}: SkillRowProps) {
    const [isTogglingAssign, setIsTogglingAssign] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const effectiveStatus: SkillManifest['status'] = skill.manuallyDisabled ? 'disabled' : skill.status;
    const isBlocked = effectiveStatus === 'disabled' || effectiveStatus === 'needs-config' || effectiveStatus === 'needs-install';
    const isAssigned = selectedAgent ? (skill.assignedAgents ?? []).includes(selectedAgent) : false;

    return (
        <div className={`skill-row ${isBlocked ? 'skill-row--blocked' : ''} ${isAssigned ? 'skill-row--assigned' : ''}`}>
            {isAssigned && <div className="skill-row-accent" />}

            <div className="skill-row-main">
                <div className="skill-row-icon" style={{
                    background: isBlocked ? 'rgba(255,255,255,0.04)' : `${KIND_META[skill.kind].color}18`
                }}>
                    <span>{skill.icon || (skill.kind === 'native' ? '🛠️' : skill.kind === 'mcp' ? '🔌' : '📖')}</span>
                </div>

                <div className="skill-row-info">
                    <div className="skill-row-nameline">
                        <span className="skill-row-name">{skill.name}</span>
                        {kindIcon(skill.kind)}
                        {statusBadge(effectiveStatus)}
                        {isAssigned && selectedAgent && (
                            <span className="skill-assigned-tag">
                                <Bot size={10} /> {selectedAgent}
                            </span>
                        )}
                        {skill.homepage && (
                            <a href={skill.homepage} target="_blank" rel="noopener noreferrer" className="skill-row-homepage-mini" title="Visit homepage">
                                <Link size={10} />
                            </a>
                        )}
                    </div>
                    <p className="skill-row-desc">{skill.description}</p>

                    {effectiveStatus === 'needs-install' && skill.install?.[0] && (
                        <div className="skill-row-direct-install">
                            <code className="install-step-cmd">
                                {installStepToCommand(skill.install[0])}
                            </code>
                            <button
                                className={`btn btn-xs install-step-copy ${copiedId === 'inline' ? 'copied' : ''}`}
                                onClick={() => {
                                    const cmd = installStepToCommand(skill.install![0]);
                                    navigator.clipboard.writeText(cmd);
                                    setCopiedId('inline');
                                    setTimeout(() => setCopiedId(null), 2000);
                                }}
                            >
                                {copiedId === 'inline' ? '✓' : <Download size={10} />}
                            </button>
                        </div>
                    )}

                    {(skill.missingEnv?.length ?? 0) > 0 && (
                        <p className="skill-row-missing">
                            Missing env: {skill.missingEnv!.map(k => <code key={k}>{k}</code>)}
                        </p>
                    )}
                </div>

                <div className="skill-row-actions">
                    {/* Slot 1: Assign */}
                    <div className="action-slot">
                        {selectedAgent && skill.kind !== 'native' && effectiveStatus === 'enabled' && (
                            <button
                                className={`btn btn-xs ${isAssigned ? 'btn-outline' : 'btn-primary'}`}
                                onClick={async () => {
                                    if (isTogglingAssign || !selectedAgent) return;
                                    setIsTogglingAssign(true);
                                    try {
                                        await onToggleAssign(skill.name, selectedAgent, isAssigned);
                                    } finally {
                                        setIsTogglingAssign(false);
                                    }
                                }}
                                disabled={isTogglingAssign}
                            >
                                {isTogglingAssign ? <RefreshCw size={11} className="spin" /> : <Bot size={11} />}
                                {isAssigned ? 'Unassign' : 'Assign'}
                            </button>
                        )}
                    </div>

                    {/* Slot 2: Config / Install */}
                    <div className="action-slot">
                        {effectiveStatus === 'needs-config' && (
                            <button className="btn btn-xs btn-warning" onClick={() => onConfigure(skill)}>
                                <Settings size={11} /> Config
                            </button>
                        )}
                        {effectiveStatus === 'needs-install' && (
                            <button
                                className="btn btn-xs btn-primary"
                                onClick={() => onInstall(skill.name)}
                                disabled={isInstalling}
                            >
                                {isInstalling ? <RefreshCw size={11} className="spin" /> : <Download size={11} />}
                                Install
                            </button>
                        )}
                    </div>

                    {/* Slot 3: Toggle */}
                    <div className="action-slot">
                        {(effectiveStatus === 'enabled' || skill.manuallyDisabled) && skill.kind !== 'native' && (
                            <button
                                className={`btn btn-xs ${skill.manuallyDisabled ? 'btn-success' : 'btn-ghost'}`}
                                onClick={() => onToggleDisable(skill.name, !!skill.manuallyDisabled)}
                                title={skill.manuallyDisabled ? 'Enable' : 'Disable'}
                            >
                                {skill.manuallyDisabled ? <Power size={11} /> : <PowerOff size={11} />}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Config Modal ─────────────────────────────────────────────────────────────

function ConfigModal({
    skill, onClose, onSave, isSaving
}: {
    skill: SkillManifest;
    onClose: () => void;
    onSave: (envVars: Record<string, string>) => void;
    isSaving: boolean;
}) {
    const [envVars, setEnvVars] = useState<Record<string, string>>(() => {
        const init: Record<string, string> = {};
        skill.requiredEnv?.forEach(e => { init[e.key] = ''; });
        return init;
    });

    const allFilled = skill.requiredEnv?.every(e => envVars[e.key]?.trim()) ?? true;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-title-group">
                        <Settings size={16} className="text-warning" />
                        <span>Configure <strong>{skill.name}</strong></span>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
                </div>
                <div className="modal-body">
                    <p className="modal-hint">Enter the required environment variables.</p>
                    {skill.requiredEnv?.map(env => (
                        <div key={env.key} className="modal-field">
                            <label className="modal-field-label">
                                <span>{env.key}</span>
                                {env.url && (
                                    <a href={env.url} target="_blank" rel="noopener noreferrer" className="modal-get-key">
                                        <Link size={10} /> Docs
                                    </a>
                                )}
                            </label>
                            {env.description && <p className="modal-field-desc">{env.description}</p>}
                            <input
                                type="text"
                                className="skills-search"
                                value={envVars[env.key]}
                                onChange={e => setEnvVars(v => ({ ...v, [env.key]: e.target.value }))}
                                placeholder={`Enter ${env.key}...`}
                            />
                        </div>
                    ))}
                </div>
                <div className="modal-footer">
                    <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
                    <button
                        className="btn btn-primary btn-sm"
                        disabled={!allFilled || isSaving}
                        onClick={() => onSave(envVars)}
                    >
                        {isSaving ? <RefreshCw size={14} className="spin" /> : <Save size={14} />}
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function Skills() {
    const [isLoading, setIsLoading] = useState(true);
    const [skills, setSkills] = useState<SkillManifest[]>([]);
    const [agents, setAgents] = useState<AgentConfig[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [installResult, setInstallResult] = useState<{ name: string; success: boolean; output?: string } | null>(null);
    const [configSkill, setConfigSkill] = useState<SkillManifest | null>(null);
    const [isConfiguring, setIsConfiguring] = useState(false);
    const [isInstalling, setIsInstalling] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [s, a] = await Promise.all([
                api.getSkillManifests(selectedAgent || undefined),
                api.getAgents()
            ]);
            setSkills(s);
            setAgents(a);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [selectedAgent]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleInstall = async (name: string) => {
        setIsInstalling(name);
        try {
            const result = await api.installSkill(name);
            setInstallResult({ name, ...result });
            if (result.success) loadData();
        } catch (err) {
            setInstallResult({ name, success: false, output: String(err) });
        } finally {
            setIsInstalling(null);
        }
    };

    const handleToggleDisable = async (name: string, current: boolean) => {
        try {
            await (current ? api.enableSkill(name) : api.disableSkill(name));
            loadData();
        } catch (err) { console.error(err); }
    };

    const handleToggleAssign = async (skillName: string, agentName: string, assigned: boolean) => {
        const agent = agents.find(a => a.name === agentName);
        if (!agent) return;
        const newSkills = assigned
            ? (agent.skills ?? []).filter(s => s !== skillName)
            : [...(agent.skills ?? []), skillName];
        try {
            await api.updateAgentSkills(agentName, newSkills);
            loadData();
        } catch (err) { console.error(err); }
    };

    const handleSaveConfig = async (env: Record<string, string>) => {
        if (!configSkill) return;
        setIsConfiguring(true);
        try {
            await api.configureSkill(configSkill.name, env);
            setConfigSkill(null);
            loadData();
        } catch (err) { console.error(err); }
        finally { setIsConfiguring(false); }
    };

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return skills.filter(s =>
            s.name.toLowerCase().includes(q) ||
            s.description.toLowerCase().includes(q) ||
            s.kind.toLowerCase().includes(q)
        );
    }, [skills, search]);

    const prompt = filtered.filter(s => s.kind === 'prompt');
    const mcp = filtered.filter(s => s.kind === 'mcp');
    const native = filtered.filter(s => s.kind === 'native');

    const rowProps = (s: SkillManifest) => ({
        skill: s, selectedAgent,
        onConfigure: setConfigSkill,
        onInstall: handleInstall,
        onToggleDisable: handleToggleDisable,
        onToggleAssign: handleToggleAssign,
        isInstalling: isInstalling === s.name
    });

    return (
        <div className="skills-page p-fade-in">
            <div className="skills-header">
                <div>
                    <h1 className="skills-title">Registry</h1>
                    <p className="skills-subtitle">Manage skill prompts and MCP tool capabilities.</p>
                </div>
            </div>

            <div className="skills-toolbar">
                <div className="skills-search-wrap">
                    <Search size={14} className="skills-search-icon" />
                    <input
                        className="skills-search"
                        placeholder="Search skills..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    {search && (
                        <button className="skills-search-clear" onClick={() => setSearch('')}>
                            <X size={12} />
                        </button>
                    )}
                </div>
                <div className="skills-agent-filter">
                    <Bot size={14} className="text-muted" />
                    <select
                        className="form-select"
                        value={selectedAgent ?? ''}
                        onChange={e => setSelectedAgent(e.target.value || null)}
                    >
                        <option value="">All agents</option>
                        {agents.map(a => (
                            <option key={a.name} value={a.name}>{a.name}</option>
                        ))}
                    </select>
                </div>
                <span className="skills-count">{filtered.length} / {skills.length} skills</span>
            </div>

            {isLoading ? (
                <div className="skills-loading"><RefreshCw className="spin" /></div>
            ) : (
                <div className="skills-list">
                    {installResult && (
                        <InstallToast result={installResult} onClose={() => setInstallResult(null)} />
                    )}
                    {prompt.length > 0 && (
                        <div className="skill-category">
                            <h3 className="category-title"><Terminal size={14} /> Prompt Skills</h3>
                            {prompt.map(s => <SkillRow key={s.name} {...rowProps(s)} />)}
                        </div>
                    )}
                    {mcp.length > 0 && (
                        <div className="skill-category">
                            <h3 className="category-title"><Puzzle size={14} /> MCP Tools</h3>
                            {mcp.map(s => <SkillRow key={s.name} {...rowProps(s)} />)}
                        </div>
                    )}
                    {native.length > 0 && (
                        <div className="skill-category">
                            <h3 className="category-title"><Wrench size={14} /> Native Tools</h3>
                            {native.map(s => <SkillRow key={s.name} {...rowProps(s)} />)}
                        </div>
                    )}
                </div>
            )}

            {configSkill && (
                <ConfigModal
                    skill={configSkill}
                    onClose={() => setConfigSkill(null)}
                    onSave={handleSaveConfig}
                    isSaving={isConfiguring}
                />
            )}
        </div>
    );
}

function InstallToast({ result, onClose }: { result: any; onClose: () => void }) {
    return (
        <div className={`install-toast ${result.success ? 'success' : 'error'}`}>
            <div className="install-toast-header">
                {result.success ? <CheckCircle2 size={16} className="text-success" /> : <AlertCircle size={16} className="text-danger" />}
                <span>{result.name}: {result.success ? 'Installation successful' : 'Installation failed'}</span>
                <button className="btn btn-ghost btn-xs" style={{ marginLeft: 'auto' }} onClick={onClose}><X size={14} /></button>
            </div>
            {result.output && <pre className="install-toast-output">{result.output}</pre>}
        </div>
    );
}
