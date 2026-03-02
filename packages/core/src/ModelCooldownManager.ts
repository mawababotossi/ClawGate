/**
 * @license Apache-2.0
 * ClawGate — Model Cooldown Manager
 */

const COOLDOWN_STEPS_MS = [
    60_000,      // 1 minute
    300_000,     // 5 minutes
    1_500_000,   // 25 minutes
    3_600_000,   // 1 hour (cap)
];

interface CooldownState {
    until: number;     // timestamp de fin de cooldown
    stepIndex: number; // étape actuelle
}

export class ModelCooldownManager {
    private state = new Map<string, CooldownState>();

    /** 
     * Records a failure for a model and increases its cooldown.
     */
    recordFailure(model: string): void {
        const current = this.state.get(model);
        const nextStep = Math.min((current?.stepIndex ?? -1) + 1, COOLDOWN_STEPS_MS.length - 1);
        const until = Date.now() + COOLDOWN_STEPS_MS[nextStep];
        this.state.set(model, { until, stepIndex: nextStep });
        const mins = COOLDOWN_STEPS_MS[nextStep] / 60_000;
        console.warn(`[cooldown] Model "${model}" entering cooldown for ${mins} min`);
    }

    /** 
     * Resets cooldown state for a model upon successful request.
     */
    recordSuccess(model: string): void {
        this.state.delete(model);
    }

    /** 
     * Checks if a model is currently in cooldown.
     */
    isOnCooldown(model: string): boolean {
        const s = this.state.get(model);
        if (!s) return false;
        if (Date.now() >= s.until) {
            this.state.delete(model);
            return false;
        }
        return true;
    }

    /** 
     * Picks the first available model from the list.
     */
    pickAvailable(models: string[]): string | null {
        return models.find(m => !this.isOnCooldown(m)) ?? null;
    }

    /** 
     * Returns current cooldown statuses for debugging.
     */
    getStatus(): Record<string, { cooldownUntil: string; stepIndex: number }> {
        const result: Record<string, any> = {};
        for (const [model, state] of this.state) {
            result[model] = {
                cooldownUntil: new Date(state.until).toISOString(),
                stepIndex: state.stepIndex,
            };
        }
        return result;
    }
}
