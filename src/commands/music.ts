import {
    SlashCommandBuilder,
} from "@discordjs/builders";
import {
    entersState,
    getVoiceConnection,
    joinVoiceChannel,
    VoiceConnection,
    VoiceConnectionStatus,
} from "@discordjs/voice";
import {
    CommandInteraction,
    GuildMember,
    MessageEmbed,
} from "discord.js";
import { nagPlayer } from "../modules/Music_Bot/nagPlayer";
import { guildPlayers } from "../modules/Music_Bot/guildPlayers";
import { nagLogger } from "../modules/nagLogger";
import { Video } from "play-dl/dist/YouTube/classes/Video";
import { Channel } from "play-dl/dist/YouTube/classes/Channel";

/**
 * Re-usable function for making a now playing display
 *
 * @param {video_details} Details
 */
export const nowPlayingEmbedCreator =
    (video: Video): MessageEmbed => {
        if (video) {
            const embed = new MessageEmbed();
            embed.setColor("AQUA")
                .setTitle("🎧 Now Playing!")
                .addFields(
                    { name: "Title", value: video.title as string },
                    { name: "Channel", value: (video.channel as Channel)
                        .name as string },
                    { name: "Length", value: video.durationRaw },
                );
            if (video.thumbnail && video.thumbnail.url) {
                embed.setThumbnail(video.thumbnail.url);
            }
            if (video.url) {
                embed.setURL(video.url);
            }
            return embed;
        }
        else {
            throw new Error("Cannot create now-playing embed!");
        }
    };

/**
 * Joins VC
 *
 * @param {GuildMember} author
 * @return {*}  {VoiceConnection}
 */
const joinVC = function(author: GuildMember): VoiceConnection {
    if (!author.voice.channelId) {
        throw new Error("Cannot find voice channelId!");
    }
    const connection = joinVoiceChannel({
        channelId: author.voice.channelId as string,
        guildId: author.guild.id as string,
        adapterCreator: author.guild.voiceAdapterCreator,
    });
    return connection;
};

/**
 * Handles the bot's music command
 */
module.exports = {
    nowPlayingEmbedCreator,
    data: new SlashCommandBuilder()
        .setName("music")
        .setDescription("Control music bot")
        .addSubcommand(subcommand =>
            subcommand
                .setName("play")
                .setDescription("Add a song to music bot to play")
                .addStringOption(option =>
                    option
                        .setName("input")
                        .setDescription("A YouTube link or search query")))
        .addSubcommand(subcommand =>
            subcommand
                .setName("skip")
                .setDescription("Skips current song"))
        .addSubcommand(subcommand =>
            subcommand
                .setName("stop")
                .setDescription("Stops music player and disconnection from " +
                    "voice channel")),
    async execute(interaction: CommandInteraction) {
        if (interaction.options.getSubcommand() === "play") {
            const input = interaction.options.getString("input");

            if (!input) {
                interaction.reply("Invalid input!");
            }
            else if (interaction.guild !== null) {
                const guild = interaction.guild;
                // Attempt to get guild's nagPlayer
                let player = guildPlayers.get(interaction.guild.id);
                // If not, create new player
                if (!player) {
                    let connection = getVoiceConnection(guild.id);
                    if (!connection) {
                        // Attempt to join VC if not guild voice
                        // connection found
                        try {
                            connection =
                                joinVC(interaction.member as GuildMember);
                        }
                        catch (error) {
                            interaction
                                .reply("You are not in a voice channel!");
                            return;
                        }
                        if (connection) {
                            // Register event for handling random disconnects
                            connection.on(VoiceConnectionStatus.Disconnected,
                                async () => {
                                    try {
                                        await Promise.race([
                                            entersState(connection as
                                                VoiceConnection,
                                            VoiceConnectionStatus
                                                .Signalling,
                                            5_000),
                                            entersState(connection as
                                                VoiceConnection,
                                            VoiceConnectionStatus
                                                .Connecting,
                                            5_000),
                                        ]);
                                    }
                                    catch (error) {
                                        (connection as VoiceConnection)
                                            .destroy();
                                        nagLogger
                                            .getInstance()
                                            .log("debug",
                                                "Deleting nagPlayer " +
                                                "instance in " + guild.name);
                                        guildPlayers.delete(guild.id);
                                    }
                                });
                        }
                    }
                    player = new nagPlayer(connection);
                    guildPlayers.set(interaction.guild.id, player);
                }

                try {
                    await player.addSongs(input);
                    await interaction.reply("Adding songs to queue...");
                }
                catch (error) {
                    interaction.reply("Could not add music to queue" +
                        " (Invalid Input?)");
                    console.log(error);
                    return;
                }
                player.playAll((video) => {
                    if (video) {
                        interaction.followUp(
                            { embeds: [nowPlayingEmbedCreator(video)] });
                    }
                });
            }
            else {
                interaction.followUp("You are not sending this from a valid" +
                    "Guild!");
            }
        }
        else if (interaction.options.getSubcommand() === "skip") {
            const guild = interaction.guild;
            if (guild) {
                const player = guildPlayers.get(guild.id);
                if (!player) {
                    await interaction.reply("Currently not connected to this " +
                    "guild's voice channel!");
                }
                else {
                    await interaction.reply("Skipping music...");
                    const video = await player.skipMusic();
                    if (video) {
                        await interaction.editReply(
                            { embeds: [(nowPlayingEmbedCreator(video))] }
                        );
                    }
                }
            }
            else {
                await interaction.reply("Cannot find guild!");
            }
        }
        else if (interaction.options.getSubcommand() === "stop") {
            const guild = interaction.guild;
            if (guild) {
                const player = guildPlayers.get(guild.id);
                if (!player) {
                    await interaction.reply("Currently not connected to this " +
                    "guild's voice channel!");
                }
                else {
                    player.destroy();
                    guildPlayers.delete(guild.id);
                    // Bot will be destroyed by disconnect handler above
                    await interaction.reply("Bot stopped");
                }
            }
            else {
                await interaction.reply("Cannot find guild!");
            }
        }
    },
};