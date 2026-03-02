/**
 * @license Apache-2.0
 * @geminiclaw/skills — Types defining what a Skill is.
 */
import type { FunctionDeclaration, Schema } from '@google/genai';
import { SkillMdEnvVar } from './SkillMdLoader.js';

export type SkillKind = 'prompt' | 'mcp' | 'native';
export type SkillStatus = 'enabled' | 'disabled' | 'needs-config' | 'needs-install';

export interface SkillManifest {
    name: string;
    description: string;
    kind: SkillKind;
    status: SkillStatus;
    // For prompt skills (SKILL.md)
    path?: string;
    requiredEnv?: SkillMdEnvVar[];
    missingEnv?: string[];
    missingBins?: string[];
    reason?: string;
    // For MCP/Native skills
    parameters?: Schema;
    // Manual disablement
    manuallyDisabled?: boolean;
    // UI
    icon?: string;
    // For prompt skills
    install?: any;
    homepage?: string;
}

export interface Skill {
    /** Internal name of the skill (alphanumeric and underscores) */
    name: string;

    /** Description for the LLM to know when to use it */
    description: string;

    /** JSON Schema defining the expected parameters */
    parameters: Schema;

    /** 
     * Type of skill: 'native' (built-in) or 'mcp' (external).
     * Defaults to 'mcp' if not specified.
     */
    kind?: 'native' | 'mcp';

    /**
     * The actual execution logic for the skill.
     * Receives the arguments parsed by the LLM and returns the result (usually an object).
     */
    execute: (args: Record<string, unknown>) => Promise<unknown> | unknown;
}

/** Utility to extract just the Gemini-compatible declaration from a Skill */
export function extractDeclaration(skill: Skill): FunctionDeclaration {
    return {
        name: skill.name,
        description: skill.description,
        parameters: skill.parameters,
    };
}
