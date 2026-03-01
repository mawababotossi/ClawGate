import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { RefreshCw, Wrench, Puzzle, Shield, Terminal, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import './Skills.css';

export function Skills() {
    const [skills, setSkills] = useState<{ native: any[], project: any[], prompt: any[] }>({ native: [], project: [], prompt: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [isInstalling, setIsInstalling] = useState<string | null>(null);
    const [installResult, setInstallResult] = useState<{ name: string, success: boolean, output: string } | null>(null);

    const fetchSkills = async () => {
        try {
            setIsLoading(true);
            const data = await api.getSkills();
            setSkills(data);
        } catch (err) {
            console.error('Failed to fetch skills', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInstall = async (name: string) => {
        try {
            setIsInstalling(name);
            setInstallResult(null);
            const result = await api.installSkill(name);
            setInstallResult({ name, ...result });
            if (result.success) {
                await fetchSkills();
            }
        } catch (err: any) {
            setInstallResult({ name, success: false, output: err.message });
        } finally {
            setIsInstalling(null);
        }
    };

    useEffect(() => {
        fetchSkills();
    }, []);

    return (
        <div className="page-container skills-page">
            <div className="page-header mb-8 flex justify-between items-center">
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Skills & Tools</h1>
                    <p className="text-muted text-sm">Overview of all capabilities available to agents.</p>
                </div>
                <button className="btn btn-outline btn-sm" onClick={fetchSkills} disabled={isLoading}>
                    <RefreshCw size={14} className={`mr-2 ${isLoading ? "animate-spin" : ""}`} /> Refresh
                </button>
            </div>

            {installResult && (
                <div className={`mb-8 p-4 rounded-lg border flex flex-col gap-2 ${installResult.success ? 'bg-success/10 border-success/30' : 'bg-error/10 border-error/30'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {installResult.success ? <CheckCircle2 size={18} className="text-success" /> : <AlertCircle size={18} className="text-error" />}
                            <span className="font-bold">Installation: {installResult.name}</span>
                        </div>
                        <button className="btn btn-xs btn-ghost" onClick={() => setInstallResult(null)}>Close</button>
                    </div>
                    <pre className="text-xs font-mono bg-black/20 p-2 rounded max-h-40 overflow-auto whitespace-pre-wrap">
                        {installResult.output}
                    </pre>
                </div>
            )}

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <RefreshCw className="animate-spin text-primary" size={40} />
                </div>
            ) : (
                <div className="skills-layout flex flex-col gap-8">
                    {/* Native Skills */}
                    <div className="skills-section">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-primary/10 rounded-md text-primary">
                                <Wrench size={20} />
                            </div>
                            <h2 className="text-lg font-bold">Native Tools</h2>
                        </div>
                        <p className="text-muted text-sm mb-6">Built-in tools provided directly by the Gemini CLI core runtime.</p>

                        <div className="skills-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {skills.native.map(skill => (
                                <div key={skill.name} className="skill-card glass-card p-4">
                                    <div className="flex items-start gap-4">
                                        <div className="skill-icon-flat shrink-0 w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-lg">
                                            {skill.icon || '🛠️'}
                                        </div>
                                        <div className="skill-content grow">
                                            <h3 className="text-sm font-bold mb-1">{skill.name}</h3>
                                            <p className="text-xs text-muted leading-relaxed">{skill.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {skills.native.length === 0 && (
                                <div className="col-span-full py-8 text-center glass-panel opacity-50">
                                    <p className="text-sm italic">No native tools found.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* OpenClaw Skills (Prompt-driven) */}
                    <div className="skills-section">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-accent/10 rounded-md text-accent">
                                <Terminal size={20} />
                            </div>
                            <h2 className="text-lg font-bold">OpenClaw Skills</h2>
                        </div>
                        <p className="text-muted text-sm mb-6">Prompt-driven instructions for specific external tools and services.</p>

                        <div className="skills-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {skills.prompt.map(skill => (
                                <div key={skill.name} className={`skill-card glass-card p-4 ${skill.status === 'disabled' ? 'opacity-70' : ''}`}>
                                    <div className="flex items-start gap-4">
                                        <div className="skill-icon-flat shrink-0 w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-lg">
                                            {skill.icon || '🦞'}
                                        </div>
                                        <div className="skill-content grow">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="text-sm font-bold flex items-center gap-2">
                                                    {skill.name}
                                                    {skill.status === 'enabled' ? (
                                                        <CheckCircle2 size={12} className="text-success" />
                                                    ) : (
                                                        <AlertCircle size={12} className="text-warning" />
                                                    )}
                                                </h3>
                                                {skill.status === 'disabled' && skill.install && (
                                                    <button
                                                        className="btn btn-xs btn-primary gap-1"
                                                        onClick={() => handleInstall(skill.name)}
                                                        disabled={isInstalling !== null}
                                                    >
                                                        {isInstalling === skill.name ? <RefreshCw size={10} className="animate-spin" /> : <Download size={10} />}
                                                        Install
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted leading-relaxed mb-2">{skill.description}</p>
                                            {skill.status === 'disabled' && (
                                                <div className="text-[10px] bg-red-500/10 text-red-400 p-1 rounded border border-red-500/20 italic">
                                                    {skill.reason}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {skills.prompt.length === 0 && (
                                <div className="col-span-full py-8 text-center glass-panel opacity-50">
                                    <p className="text-sm italic">No OpenClaw skills found.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Project Skills */}
                    <div className="skills-section">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-secondary/10 rounded-md text-secondary">
                                <Puzzle size={20} />
                            </div>
                            <h2 className="text-lg font-bold">Project Skills (MCP)</h2>
                        </div>
                        <p className="text-muted text-sm mb-6">Custom capabilities loaded via local Model Context Protocol (MCP) servers.</p>

                        <div className="skills-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {skills.project.map(skill => (
                                <div key={skill.name} className="skill-card glass-card p-4">
                                    <div className="flex items-start gap-4">
                                        <div className="skill-icon-flat shrink-0 w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-lg">
                                            {skill.icon || '🧩'}
                                        </div>
                                        <div className="skill-content grow">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="text-sm font-bold">{skill.name}</h3>
                                                <Shield size={12} className="text-muted opacity-40" />
                                            </div>
                                            <p className="text-xs text-muted leading-relaxed">{skill.description || 'Custom project capability'}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {skills.project.length === 0 && (
                                <div className="col-span-full py-8 text-center glass-panel opacity-50">
                                    <p className="text-sm italic">No custom project skills currently active.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
