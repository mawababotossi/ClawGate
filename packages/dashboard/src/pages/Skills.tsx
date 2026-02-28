import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { RefreshCw, Wrench, Puzzle } from 'lucide-react';
import './Skills.css';

export function Skills() {
    const [skills, setSkills] = useState<{ native: any[], project: any[] }>({ native: [], project: [] });
    const [isLoading, setIsLoading] = useState(true);

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

    useEffect(() => {
        fetchSkills();
    }, []);

    return (
        <div className="page-container">
            <div className="page-header flex justify-between items-center">
                <div>
                    <h1>Skills & Tools</h1>
                    <p>Overview of all capabilities available to agents.</p>
                </div>
                <button className="btn btn-outline" onClick={fetchSkills} disabled={isLoading}>
                    <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} /> Refresh
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <RefreshCw className="animate-spin text-primary" size={40} />
                </div>
            ) : (
                <div className="skills-layout">
                    {/* Native Skills */}
                    <div className="skills-section glass-panel">
                        <div className="skills-section-header">
                            <Wrench className="text-primary" size={24} />
                            <h2>Native Tools (Gemini CLI)</h2>
                        </div>
                        <p className="text-muted mb-4">Built-in tools provided directly by the Gemini CLI.</p>

                        <div className="skills-grid">
                            {skills.native.map(skill => (
                                <div key={skill.name} className="skill-card native-card">
                                    <div className="skill-icon">{skill.icon || '🛠️'}</div>
                                    <div className="skill-content">
                                        <h3>{skill.name}</h3>
                                        <p>{skill.description}</p>
                                    </div>
                                </div>
                            ))}
                            {skills.native.length === 0 && <p className="text-muted">No native tools found.</p>}
                        </div>
                    </div>

                    {/* Project Skills */}
                    <div className="skills-section glass-panel mt-6">
                        <div className="skills-section-header">
                            <Puzzle className="text-accent" size={24} />
                            <h2>Project Skills (MCP Servers)</h2>
                        </div>
                        <p className="text-muted mb-4">Custom tools loaded via local Model Context Protocol (MCP) servers.</p>

                        <div className="skills-grid">
                            {skills.project.map(skill => (
                                <div key={skill.name} className="skill-card project-card">
                                    <div className="skill-icon">{skill.icon || '🧩'}</div>
                                    <div className="skill-content">
                                        <h3>{skill.name}</h3>
                                        <p>{skill.description || 'Custom project capability'}</p>
                                    </div>
                                </div>
                            ))}
                            {skills.project.length === 0 && <p className="text-muted">No project tools found.</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
