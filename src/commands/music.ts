import {
    SlashCommandBuilder,
} from "@discordjs/builders";
import {
    CommandInteraction,
    GuildMember,
    MessageEmbed,
    VoiceChannel,
} from "discord.js";
import { nagPlayer, nagVideo } from "../modules/Music_Bot/nagPlayer";

/**
 * Re-usable function for making a now playing display
 *
 * @param {video_details} Details
 */
export const nowPlayingEmbedCreator =
    (video: nagVideo): MessageEmbed => {
        if (video) {
            const embed = new MessageEmbed();
            console.log(video.title);
            embed.setColor("AQUA")
                .setTitle("🎧 Now Playing!")
                .addFields(
                    { name: "Title", value: video.title },
                    { name: "Channel", value: video.channel },
                    { name: "Duration", value: video.duration }
                );
            if (video.thumbnailUrl) {
                embed.setThumbnail(video.thumbnailUrl);
            }
            if (video.channel) {
                embed.setURL(video.streamUrl);
            }
            return embed;
        }
        else {
            throw new Error("Cannot create now-playing embed!");
        }
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
            const player = new nagPlayer(
                (interaction.member as GuildMember)
                    .voice.channel as VoiceChannel);
            if (!player) {
                interaction.reply("You're not in a voice channel!");
                return;
            }
            const input = interaction.options.getString("input");
            if (!input) {
                await interaction.reply("No input found!");
                return;
            }

            // If input is not a link
            await interaction.reply("Adding songs to queue");
            if (!await player.addSongsFromUrl(input)) {
                await interaction.followUp("Not a link!");
            }
            player.playAll((song) => {
                interaction.followUp({
                    embeds: [nowPlayingEmbedCreator(song)],
                });
            });
        }
    },
};