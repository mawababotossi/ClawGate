import type { WebSocket } from 'ws';
import type { Skill } from '@geminiclaw/skills';

export interface NodeRequest {
    jsonrpc: '2.0';
    id: string | number;
    method: string;
    params: any;
}

export interface NodeResponse {
    jsonrpc: '2.0';
    id: string | number;
    result?: any;
    error?: {
        code: number;
        message: string;
        data?: any;
    };
}

/**
 * A skill that forwards execution to a remote WebSocket node.
 */
export class RemoteSkillProxy implements Skill {
    public kind: 'mcp' = 'mcp'; // Using 'mcp' for remote skills as they behave similarly

    constructor(
        public name: string,
        public description: string,
        public parameters: any,
        private ws: WebSocket,
        private nodeId: string
    ) { }

    async execute(args: Record<string, unknown>): Promise<any> {
        return new Promise((resolve, reject) => {
            const requestId = Math.random().toString(36).substring(7);

            const request: NodeRequest = {
                jsonrpc: '2.0',
                id: requestId,
                method: this.name,
                params: args
            };

            const timeout = setTimeout(() => {
                this.ws.off('message', handler);
                reject(new Error(`Timeout executing remote skill ${this.name} on node ${this.nodeId}`));
            }, 30000);

            const handler = (data: Buffer) => {
                try {
                    const response = JSON.parse(data.toString()) as NodeResponse;
                    if (response.id === requestId) {
                        clearTimeout(timeout);
                        this.ws.off('message', handler);

                        if (response.error) {
                            reject(new Error(response.error.message));
                        } else {
                            resolve(response.result);
                        }
                    }
                } catch (err) {
                    // Ignore parse errors from unrelated messages
                }
            };

            this.ws.on('message', handler);
            this.ws.send(JSON.stringify(request));
        });
    }
}
