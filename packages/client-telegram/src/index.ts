import { Client, IAgentRuntime } from "@ai16z/eliza";
import { TelegramClient } from "./telegramClient.js";

export const TelegramClientInterface: Client = {
    async start(runtime: IAgentRuntime) {
        console.log("Telegram client started");
        const botToken = runtime.getSetting("TELEGRAM_BOT_TOKEN");
        if (!botToken) {
            throw new Error("TELEGRAM_BOT_TOKEN not found in runtime settings");
        }
        return new TelegramClient(runtime, botToken);
    },
    async stop(runtime: IAgentRuntime) {
         console.warn("Telegram client does not support stopping yet");
    },
};

export default TelegramClientInterface;
