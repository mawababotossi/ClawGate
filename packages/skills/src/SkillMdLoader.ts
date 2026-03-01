/**
 * @license Apache-2.0
 * @geminiclaw/skills — SkillMdLoader
 * 
 * Ported from OpenClaw's logic to handle prompt-driven skills (SKILL.md).
 */
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export interface SkillMd {
    name: string;
    description: string;
    path: string;
    dir: string;
    metadata: any;
    body: string;
    status: 'enabled' | 'disabled';
    reason?: string;
    install?: any[];
}

export class SkillMdLoader {
    private skillDirs: string[];

    constructor(dirs: string[]) {
        this.skillDirs = dirs;
    }

    /**
     * Load all SKILL.md files from the configured directories.
     */
    public loadAll(): SkillMd[] {
        const skills: SkillMd[] = [];

        for (const baseDir of this.skillDirs) {
            if (!fs.existsSync(baseDir)) continue;

            const entries = fs.readdirSync(baseDir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const skillPath = path.join(baseDir, entry.name, 'SKILL.md');
                    if (fs.existsSync(skillPath)) {
                        try {
                            const content = fs.readFileSync(skillPath, 'utf8');
                            const { data, content: body } = matter(content);

                            if (data.name && data.description) {
                                skills.push({
                                    name: data.name,
                                    description: data.description,
                                    path: skillPath,
                                    dir: path.dirname(skillPath),
                                    metadata: data.metadata || {},
                                    body: body.trim(),
                                    status: 'enabled', // Default, will be filtered
                                    install: data.metadata?.openclaw?.install
                                });
                            }
                        } catch (err) {
                            console.error(`[skills/loader] Failed to parse skill at ${skillPath}:`, err);
                        }
                    }
                }
            }
        }

        return skills;
    }

    /**
     * Filter skills based on available environment.
     * Updates the status and reason for each skill and returns only the enabled ones.
     */
    public filter(skills: SkillMd[]): SkillMd[] {
        for (const skill of skills) {
            const requires = skill.metadata?.openclaw?.requires;
            if (!requires) {
                skill.status = 'enabled';
                continue;
            }

            // Check bins (all required)
            if (requires.bins && Array.isArray(requires.bins)) {
                const missing = requires.bins.filter((bin: string) => !this.isBinAvailable(bin));
                if (missing.length > 0) {
                    skill.status = 'disabled';
                    skill.reason = `Missing binaries: ${missing.join(', ')}`;
                    continue;
                }
            }

            // Check anyBins (at least one required)
            if (requires.anyBins && Array.isArray(requires.anyBins)) {
                const available = requires.anyBins.some((bin: string) => this.isBinAvailable(bin));
                if (!available) {
                    skill.status = 'disabled';
                    skill.reason = `Missing any of binaries: ${requires.anyBins.join(', ')}`;
                    continue;
                }
            }

            // Check env (all required)
            if (requires.env && Array.isArray(requires.env)) {
                const missing = requires.env.filter((envVar: string) => !process.env[envVar]);
                if (missing.length > 0) {
                    skill.status = 'disabled';
                    skill.reason = `Missing environment variables: ${missing.join(', ')}`;
                    continue;
                }
            }

            skill.status = 'enabled';
        }

        return skills.filter(s => s.status === 'enabled');
    }

    public isBinAvailable(bin: string): boolean {
        // Simple check for binary availability in PATH
        // In a real scenario, we might want a more robust check (command -v)
        try {
            const paths = (process.env.PATH || '').split(path.delimiter);
            for (const p of paths) {
                if (fs.existsSync(path.join(p, bin))) return true;
            }
            return false;
        } catch {
            return false;
        }
    }

    /**
     * Format a list of SkillMd into an XML block for the system prompt.
     */
    public formatForPrompt(skills: SkillMd[]): string {
        if (skills.length === 0) return '';

        let prompt = `\n<available_skills>\n`;
        prompt += `The following skills provide specialized instructions for specific tasks.\n`;
        prompt += `If a task matches a skill's description, use the "read" tool to load its full SKILL.md file.\n`;

        for (const skill of skills) {
            prompt += `  <skill>\n`;
            prompt += `    <name>${skill.name}</name>\n`;
            prompt += `    <description>${skill.description}</description>\n`;
            prompt += `    <location>${skill.path}</location>\n`;
            prompt += `  </skill>\n`;
        }

        prompt += `</available_skills>\n`;
        return prompt;
    }
}
