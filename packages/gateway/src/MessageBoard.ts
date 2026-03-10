/**
 * @license Apache-2.0
 * @clawgate/gateway — MessageBoard
 *
 * In-memory inter-agent message board with optional JSON persistence.
 * Agents post messages to named channels and read recent messages via
 * the post_message / read_messages / list_channels MCP skills.
 */
import fs from 'node:fs';
import path from 'node:path';

export interface BoardMessage {
    id: string;
    channel: string;
    from: string;       // agent name
    text: string;
    timestamp: number;
    replyTo?: string;   // optional: id of message being replied to
}

export class MessageBoard {
    private messages: Map<string, BoardMessage[]> = new Map();
    private persistPath?: string;
    private readonly MAX_PER_CHANNEL = 100;

    constructor(dataDir?: string) {
        if (dataDir) {
            this.persistPath = path.join(dataDir, 'message_board.json');
            this.load();
        }
    }

    post(channel: string, from: string, text: string, replyTo?: string): BoardMessage {
        if (!this.messages.has(channel)) {
            this.messages.set(channel, []);
        }

        const msg: BoardMessage = {
            id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            channel,
            from,
            text,
            timestamp: Date.now(),
            replyTo
        };

        const msgs = this.messages.get(channel)!;
        msgs.push(msg);

        if (msgs.length > this.MAX_PER_CHANNEL) {
            msgs.splice(0, msgs.length - this.MAX_PER_CHANNEL);
        }

        this.persist();
        return msg;
    }

    read(channel: string, limit = 20, since?: number): BoardMessage[] {
        const msgs = this.messages.get(channel) ?? [];
        const filtered = since ? msgs.filter(m => m.timestamp > since) : msgs;
        return filtered.slice(-Math.min(limit, 50));
    }

    listChannels(): string[] {
        return Array.from(this.messages.keys());
    }

    private persist(): void {
        if (!this.persistPath) return;
        try {
            const data: Record<string, BoardMessage[]> = {};
            for (const [ch, msgs] of this.messages.entries()) {
                data[ch] = msgs;
            }
            fs.writeFileSync(this.persistPath, JSON.stringify(data, null, 2));
        } catch (err) {
            console.error('[board] Failed to persist message board:', err);
        }
    }

    private load(): void {
        if (!this.persistPath || !fs.existsSync(this.persistPath)) return;
        try {
            const raw = JSON.parse(fs.readFileSync(this.persistPath, 'utf8'));
            for (const [ch, msgs] of Object.entries(raw)) {
                this.messages.set(ch, msgs as BoardMessage[]);
            }
            console.log(`[board] Loaded message board from ${this.persistPath}`);
        } catch (err) {
            console.error('[board] Failed to load message board:', err);
        }
    }
}
