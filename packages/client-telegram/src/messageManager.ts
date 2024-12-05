import { Context, Telegraf } from 'telegraf';
import { IAgentRuntime, Memory, stringToUuid } from '@ai16z/eliza';
import { elizaLogger } from '@ai16z/eliza';

export class MessageManager {
    bot: Telegraf<Context>;
    runtime: IAgentRuntime;

    constructor(bot: Telegraf<Context>, runtime: IAgentRuntime) {
        this.bot = bot;
        this.runtime = runtime;
    }

    async handleMessage(ctx: Context) {
        if ('text' in ctx.message) {
            const text = ctx.message.text;
            const userId = stringToUuid(ctx.message.from.id.toString());
            const roomId = stringToUuid(ctx.chat.id.toString());

            // Ensure the user and room exist
            await this.runtime.ensureUserExists(
                userId,
                ctx.message.from.username || null,
                ctx.message.from.first_name || null,
                'telegram'
            );
            await this.runtime.ensureRoomExists(roomId);
            await this.runtime.ensureParticipantInRoom(userId, roomId);

            // Create a memory for the message
            const memory: Memory = {
                id: stringToUuid(ctx.message.message_id.toString()),
                userId,
                agentId: this.runtime.agentId,
                content: {
                    text,
                    source: 'telegram',
                },
                roomId,
                createdAt: Date.now(),
            };

            // Process the message through the runtime
            await this.runtime.messageManager.createMemory(memory);
            await this.runtime.processActions(memory, [], undefined, async (response) => {
                if (response.text) {
                    await ctx.reply(response.text);
                }
                return [];
            });
        }
    }
}
