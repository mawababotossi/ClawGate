/**
 * @license Apache-2.0
 * @geminiclaw/channel-telegram — TelegramAdapter
 *
 * Uses Telegraf to receive messages and dispatch them through the Gateway.
 * Supports private chats, groups (with optional @mention gating), and photos.
 */
import { Telegraf } from 'telegraf';
import type { IGateway } from '@geminiclaw/core';
import type { Attachment, OutboundAttachment } from '@geminiclaw/memory';

const CHANNEL = 'telegram';

export interface TelegramAdapterOptions {
    /** If true, only respond when @mentioned in groups */
    mentionOnly?: boolean;
}

export class TelegramAdapter {
    private bot: Telegraf;
    private botUsername: string | null = null;

    constructor(
        token: string,
        private options: TelegramAdapterOptions = {},
    ) {
        this.bot = new Telegraf(token);
    }

    connect(gateway: IGateway): void {
        // Register send callback so gateway can reply to Telegram
        gateway.registerChannel(
            CHANNEL,
            async (peerId: string, text: string) => {
                try {
                    const chunks = this.splitMessage(text);
                    for (const chunk of chunks) {
                        await this.bot.telegram.sendMessage(peerId, chunk, {
                            parse_mode: 'Markdown',
                        });
                    }
                } catch {
                    // Retry without markdown on parse error
                    try { await this.bot.telegram.sendMessage(peerId, text); } catch { /* ignore */ }
                }
            },
            // Activity callback
            async (peerId, type) => {
                try {
                    await this.bot.telegram.sendChatAction(peerId, type === 'typing' ? 'typing' : 'find_location');
                } catch { /* ignore */ }
            },
            // File callback
            async (peerId, att: OutboundAttachment) => {
                try {
                    if (att.type === 'image' || att.mimeType.startsWith('image/')) {
                        await this.bot.telegram.sendPhoto(peerId, { source: att.data }, { caption: att.caption });
                    } else {
                        await this.bot.telegram.sendDocument(peerId, { source: att.data, filename: att.filename }, { caption: att.caption });
                    }
                } catch (err) {
                    console.error('[telegram] Failed to send file:', err);
                }
            }
        );

        // Resolve bot username for mention detection
        this.bot.telegram.getMe().then((me) => {
            this.botUsername = me.username ?? null;
        }).catch(() => { });

        // Handle text messages
        this.bot.on('text', async (ctx) => {
            const text = ctx.message.text;
            const chatId = String(ctx.chat.id);
            await this.processMessage(ctx.chat.type, chatId, text, gateway);
        });

        // Handle photo messages with captions
        this.bot.on('photo', async (ctx) => {
            const caption: string = (ctx.message as any).caption ?? '';
            const chatId = String(ctx.chat.id);

            try {
                const photos = ctx.message.photo;
                const bestPhoto = photos[photos.length - 1];
                const fileLink = await ctx.telegram.getFileLink(bestPhoto.file_id);

                const { default: fetch } = await import('node-fetch');
                const res = await (fetch as any)(fileLink.toString());
                const buffer = Buffer.from(await res.arrayBuffer());

                const attachments: Attachment[] = [{
                    type: 'image',
                    mimeType: 'image/jpeg',
                    data: buffer,
                    filename: `telegram_photo_${Date.now()}.jpg`
                }];

                await this.processMessage(ctx.chat.type, chatId, caption, gateway, attachments);
            } catch (err) {
                console.error('[telegram] Photo download failed:', err);
                await this.processMessage(ctx.chat.type, chatId, caption, gateway);
            }
        });

        // Handle document messages
        this.bot.on('document', async (ctx) => {
            const caption: string = (ctx.message as any).caption ?? '';
            const chatId = String(ctx.chat.id);

            try {
                const fileId = ctx.message.document.file_id;
                const fileLink = await ctx.telegram.getFileLink(fileId);

                const { default: fetch } = await import('node-fetch');
                const res = await (fetch as any)(fileLink.toString());
                const buffer = Buffer.from(await res.arrayBuffer());

                const attachments: Attachment[] = [{
                    type: 'document',
                    mimeType: ctx.message.document.mime_type || 'application/octet-stream',
                    data: buffer,
                    filename: ctx.message.document.file_name || 'document'
                }];

                await this.processMessage(ctx.chat.type, chatId, caption, gateway, attachments);
            } catch (err) {
                console.error('[telegram] Document download failed:', err);
                await this.processMessage(ctx.chat.type, chatId, caption, gateway);
            }
        });

        // Handle voice messages
        this.bot.on('voice', async (ctx) => {
            await ctx.reply('🎙️ Voice messages are not yet supported. Please send text.');
        });

        this.bot.launch().then(() => {
            console.log('[telegram] Bot polling started.');
        }).catch((err) => {
            console.error('[telegram] Failed to start:', err);
        });

        process.once('SIGINT', () => this.bot.stop('SIGINT'));
        process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
    }

    private async processMessage(
        chatType: string,
        chatId: string,
        text: string,
        gateway: IGateway,
        attachments?: Attachment[],
    ): Promise<void> {
        const isGroup = chatType === 'group' || chatType === 'supergroup';

        // Mention-only mode
        if (this.options.mentionOnly && isGroup && this.botUsername) {
            if (!text.includes(`@${this.botUsername}`)) return;
            text = text.replace(`@${this.botUsername}`, '').trim();
        }

        if (!text.trim() && !attachments) return;

        await gateway.ingest(CHANNEL, chatId, text.trim() || '[Média]', attachments);
    }

    private splitMessage(text: string, maxLen = 4000): string[] {
        if (text.length <= maxLen) return [text];
        const chunks: string[] = [];
        let start = 0;
        while (start < text.length) {
            let end = Math.min(start + maxLen, text.length);
            const lastNewline = text.lastIndexOf('\n', end);
            if (lastNewline > start) end = lastNewline + 1;
            chunks.push(text.slice(start, end));
            start = end;
        }
        return chunks;
    }
}
