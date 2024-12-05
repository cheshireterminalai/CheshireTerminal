import { composeContext, stringToUuid, messageCompletionFooter } from "@ai16z/eliza";
import {
    AudioPlayer,
    AudioPlayerStatus,
    createAudioPlayer,
    createAudioResource,
    DiscordGatewayAdapterCreator,
    getVoiceConnection,
    joinVoiceChannel,
    VoiceConnection,
    VoiceConnectionStatus,
} from "@discordjs/voice";
import {
    ChannelType,
    Guild,
    GuildMember,
    Interaction,
    VoiceBasedChannel,
    VoiceState,
} from "discord.js";
import { Readable } from "stream";
import { DiscordClient } from ".";

export const voiceMessageHandlerTemplate = `# Action Examples
{{actionExamples}}
(Action examples are for reference only. Do not use the information from them in your response.)

# Knowledge
{{knowledge}}

# Task: Generate dialog and actions for the character {{agentName}}.
About {{agentName}}:
{{bio}}
{{lore}}

Examples of {{agentName}}'s dialog and actions:
{{characterMessageExamples}}

{{providers}}

{{attachments}}

{{actions}}

# Capabilities
Note that {{agentName}} is capable of reading/seeing/hearing various forms of media, including images, videos, audio, plaintext and PDFs. Recent attachments have been included above under the "Attachments" section.

{{messageDirections}}

{{recentMessages}}

# Instructions: Write the next message for {{agentName}}. Include an action, if appropriate. {{actionNames}}
` + messageCompletionFooter;

export class VoiceManager {
    private client: DiscordClient;
    private voiceConnections: Map<string, VoiceConnection> = new Map();
    private audioPlayers: Map<string, AudioPlayer> = new Map();

    constructor(client: DiscordClient) {
        this.client = client;
    }

    async handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
        // Handle voice state updates here
        // For example, you might want to join/leave voice channels based on user actions
    }

    async handleUserStream(oldState: VoiceState, newState: VoiceState) {
        // Handle user stream events here
        // For example, you might want to process audio streams from users
    }

    async handleJoinChannelCommand(interaction: Interaction) {
        if (!interaction.isCommand()) return;

        const member = interaction.member as GuildMember;
        const voiceChannel = member.voice.channel;

        if (!voiceChannel) {
            await interaction.reply({
                content: "You need to be in a voice channel first!",
                ephemeral: true,
            });
            return;
        }

        try {
            await this.joinVoiceChannel(voiceChannel);
            await interaction.reply({
                content: `Joined ${voiceChannel.name}!`,
                ephemeral: true,
            });
        } catch (error) {
            console.error("Error joining voice channel:", error);
            await interaction.reply({
                content: "Failed to join the voice channel.",
                ephemeral: true,
            });
        }
    }

    async handleLeaveChannelCommand(interaction: Interaction) {
        if (!interaction.isCommand()) return;

        const guildId = interaction.guildId;
        if (!guildId) {
            await interaction.reply({
                content: "This command can only be used in a server!",
                ephemeral: true,
            });
            return;
        }

        const connection = this.voiceConnections.get(guildId);
        if (!connection) {
            await interaction.reply({
                content: "I'm not in any voice channel!",
                ephemeral: true,
            });
            return;
        }

        try {
            connection.destroy();
            this.voiceConnections.delete(guildId);
            await interaction.reply({
                content: "Left the voice channel!",
                ephemeral: true,
            });
        } catch (error) {
            console.error("Error leaving voice channel:", error);
            await interaction.reply({
                content: "Failed to leave the voice channel.",
                ephemeral: true,
            });
        }
    }

    async scanGuild(guild: Guild) {
        // Scan the guild for voice channels and set up any necessary connections
        const channels = guild.channels.cache.filter(
            (channel) => channel.type === ChannelType.GuildVoice
        );

        for (const [, channel] of channels) {
            const voiceChannel = channel as VoiceBasedChannel;
            // You might want to add logic here to determine which channels to join
            // For now, we'll just log them
            console.log(
                `Found voice channel: ${voiceChannel.name} in ${guild.name}`
            );
        }
    }

    private async joinVoiceChannel(channel: VoiceBasedChannel) {
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild
                .voiceAdapterCreator as DiscordGatewayAdapterCreator,
        });

        this.voiceConnections.set(channel.guild.id, connection);

        connection.on(VoiceConnectionStatus.Ready, () => {
            console.log("Voice connection is ready!");
        });

        connection.on(VoiceConnectionStatus.Disconnected, async () => {
            try {
                await Promise.race([
                    entersState(connection, VoiceConnectionStatus.Signalling, 5000),
                    entersState(connection, VoiceConnectionStatus.Connecting, 5000),
                ]);
            } catch (error) {
                connection.destroy();
                this.voiceConnections.delete(channel.guild.id);
            }
        });

        return connection;
    }

    async playAudioStream(userId: string, audioStream: Readable) {
        const connection = getVoiceConnection(userId);
        if (!connection) {
            console.error("No voice connection found");
            return;
        }

        const player =
            this.audioPlayers.get(userId) || createAudioPlayer();
        if (!this.audioPlayers.has(userId)) {
            this.audioPlayers.set(userId, player);
            connection.subscribe(player);
        }

        const resource = createAudioResource(audioStream);
        player.play(resource);

        return new Promise((resolve, reject) => {
            player.on(AudioPlayerStatus.Idle, () => {
                resolve(true);
            });

            player.on("error", (error) => {
                console.error("Error playing audio:", error);
                reject(error);
            });
        });
    }
}

// Helper function to handle voice connection state changes
async function entersState(
    connection: VoiceConnection,
    status: VoiceConnectionStatus,
    timeout: number
): Promise<void> {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => reject(new Error("Timeout")), timeout);
        connection.once(status, () => {
            clearTimeout(timeoutId);
            resolve();
        });
    });
}
