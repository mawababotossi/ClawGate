import { EventEmitter } from 'node:events';
import type { WebSocket } from 'ws';
import { RemoteSkillProxy } from './RemoteSkillProxy.js';
import type { SkillRegistry } from '@geminiclaw/skills';

export interface NodeInfo {
    id: string;
    skills: { name: string; description: string; parameters: any }[];
}

export class NodeManager extends EventEmitter {
    private nodes = new Map<string, { ws: WebSocket; info: NodeInfo; skillProxies: RemoteSkillProxy[] }>();

    constructor(private skillRegistry: SkillRegistry, private nodeSecret?: string) {
        super();
    }

    public handleConnection(ws: WebSocket) {
        let authenticated = !this.nodeSecret;
        let nodeId: string | null = null;

        ws.on('message', async (data) => {
            try {
                const message = JSON.parse(data.toString());

                // 1. Handshake / Auth
                if (message.type === 'handshake') {
                    if (this.nodeSecret && message.secret !== this.nodeSecret) {
                        ws.send(JSON.stringify({ type: 'error', message: 'Unauthorized' }));
                        ws.close();
                        return;
                    }

                    authenticated = true;
                    nodeId = message.nodeId || `node_${Math.random().toString(36).substring(7)}`;
                    const skills = message.skills || [];

                    console.log(`[nodes] Node connected: ${nodeId} with ${skills.length} skills`);

                    const skillProxies = skills.map((s: any) => {
                        const proxy = new RemoteSkillProxy(s.name, s.description, s.parameters, ws, nodeId!);
                        this.skillRegistry.register(proxy);
                        return proxy;
                    });

                    this.nodes.set(nodeId!, { ws, info: { id: nodeId!, skills }, skillProxies });
                    ws.send(JSON.stringify({ type: 'handshake_ok', nodeId }));
                    this.emit('node_connected', nodeId);
                    return;
                }

                if (!authenticated) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Handshake required' }));
                    ws.close();
                    return;
                }

                // Handle heartbeats
                if (message.type === 'heartbeat') {
                    ws.send(JSON.stringify({ type: 'heartbeat_ack' }));
                    return;
                }

            } catch (err) {
                console.error('[nodes] Error parsing message:', err);
            }
        });

        ws.on('close', () => {
            if (nodeId && this.nodes.has(nodeId)) {
                console.log(`[nodes] Node disconnected: ${nodeId}`);
                const node = this.nodes.get(nodeId)!;
                node.skillProxies.forEach(proxy => {
                    this.skillRegistry.unregister(proxy.name);
                });
                this.nodes.delete(nodeId);
                this.emit('node_disconnected', nodeId);
            }
        });

        ws.on('error', (err) => {
            console.error(`[nodes] WebSocket error for ${nodeId || 'unknown'}:`, err);
        });
    }

    public getConnectedNodes(): NodeInfo[] {
        return Array.from(this.nodes.values()).map(n => n.info);
    }
}
