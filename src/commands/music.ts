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
import { video_details } from "../modules/Music_Bot/songQueue";
import { ConnectionVisibility } from "discord-api-types";

/**
 * Re-usable function for making a now playing display
 *
 * @param {video_details} Details
 */
export const nowPlayingEmbedCreator =
    (details: video_details): MessageEmbed => {
        const embed = new MessageEmbed();
        embed.setColor("AQUA")
            .setTitle("🎧 Now Playing!")
            .setThumbnail(details.thumbnail.url)
            .setURL(details.url)
            .addFields(
                { name: "Title", value: details.title },
                { name: "Channel", value: details.channel.name },
                { name: "Length", value: details.durationRaw }
            );
        return embed;
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
                .setDescription("Skips current song")),
    /*
    .addStringOption(option =>
    option
    .setName("input")
    .setDescription("Link or search query")
    .setRequired(true))
    .addStringOption(option =>
    option
    .setName("filter")
    .setDescription("Set FFMpeg filters")
    .setRequired(false)),
    */
    async execute(interaction: CommandInteraction) {
        // Add song and playing implementation
        if (interaction.options.getSubcommand() === "play") {
            const input = interaction.options.getString("input");

            if (!input) {
                interaction.reply("Invalid input!");
            }
            else if (interaction.guild !== null) {
                const guild = interaction.guild;
                let player = guildPlayers.get(interaction.guild.id);
                if (!player) {
                    let connection = getVoiceConnection(guild.id);
                    if (!connection) {
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
                    await player.addSongsFromLink(input);
                    await interaction.reply("Adding songs to queue...");
                }
                catch (error) {
                    interaction.reply("Could not add music to queue" +
                        " (Invalid Input?)");
                    // Auto delete this message
                    return;
                }
                player.playAll((details) => {
                    // Continue to display song information until
                    // there's no more
                    if (details) {
                        interaction.editReply(
                            { embeds: [nowPlayingEmbedCreator(details)] });
                    }
                    else {
                        interaction.editReply("No more songs in queue....");
                        // Auto delete this message
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
                    const songDetails = player.skipMusic();
                    if (songDetails) {
                        await interaction.editReply(
                            { embeds: [nowPlayingEmbedCreator(songDetails)] });
                    }
                }
            }
            else {
                await interaction.reply("Cannot find guild!");
            }
        }
    },
};