/**
 * @license Apache-2.0
 * @geminiclaw/skills — SkillRegistry
 */
import type { FunctionDeclaration } from '@google/genai';
import type { Skill } from './types.js';
import { extractDeclaration } from './types.js';
import { SkillMdLoader, SkillMd } from './SkillMdLoader.js';

export class SkillRegistry {
    private skills: Map<string, Skill> = new Map();
    private skillMdLoader?: SkillMdLoader;
    private promptSkills: SkillMd[] = [];

    constructor(skillDirs?: string[]) {
        if (skillDirs && skillDirs.length > 0) {
            this.skillMdLoader = new SkillMdLoader(skillDirs);
            this.refreshPromptSkills();
        }
    }

    /** Refresh prompt-driven skills from disk */
    public refreshPromptSkills(): void {
        if (this.skillMdLoader) {
            const all = this.skillMdLoader.loadAll();
            this.promptSkills = this.skillMdLoader.filter(all);
            console.log(`[skills] Loaded ${this.promptSkills.length} prompt-driven skills.`);
        }
    }

    /** Get the prompt block for all active prompt-driven skills, or a specific subset */
    public getPromptBlock(whitelist?: string[]): string {
        if (!this.skillMdLoader) return '';

        let targetSkills = this.promptSkills;
        if (whitelist && whitelist.length > 0) {
            targetSkills = this.promptSkills.filter(s => whitelist.includes(s.name));
        }

        return this.skillMdLoader.formatForPrompt(targetSkills);
    }

    /** Get all prompt-driven skills (including disabled ones) */
    public getAllPromptSkills(): SkillMd[] {
        if (!this.skillMdLoader) return [];
        const all = this.skillMdLoader.loadAll();
        this.skillMdLoader.filter(all); // Filters and updates status/reason in-place
        return all;
    }

    /** Get filtered prompt-driven skills */
    public getActivePromptSkills(): SkillMd[] {
        return this.promptSkills;
    }

    /** Register a local skill */
    register(skill: Skill): void {
        if (this.skills.has(skill.name)) {
            console.warn(`[skills] Overwriting existing skill: ${skill.name}`);
        }
        this.skills.set(skill.name, skill);
    }

    /** Unregister a skill by name */
    unregister(name: string): void {
        this.skills.delete(name);
    }

    /** 
     * Get all registered skills as FunctionDeclarations for the LLM.
     * Returns undefined if no skills are registered (to omit from config).
     */
    getDeclarations(): FunctionDeclaration[] | undefined {
        if (this.skills.size === 0) return undefined;
        return Array.from(this.skills.values()).map(extractDeclaration);
    }

    /**
     * Execute a skill safely by its name with the provided arguments.
     * Returns an object that will be passed back to the LLM directly.
     */
    async execute(name: string, args: Record<string, unknown>): Promise<any> {
        const skill = this.skills.get(name);
        if (!skill) {
            throw new Error(`[skills] Skill not found: ${name}`);
        }

        try {
            // Wait for the skill to execute (can be sync or async)
            const result = await skill.execute(args);
            return result;
        } catch (error) {
            console.error(`[skills] Error executing skill '${name}':`, error);
            // Return a structured error back to the LLM so it can recover
            return {
                error: true,
                message: error instanceof Error ? error.message : String(error),
            };
        }
    }
}
