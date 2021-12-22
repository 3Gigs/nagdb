import {
    SlashCommandBuilder,
} from "@discordjs/builders";
import {
    CommandInteraction,
    GuildMember,
    MessageEmbed,
    VoiceChannel,
} from "discord.js";
import { nagPlayer } from "../modules/Music_Bot/nagPlayer";
import { nagVideo } from "../modules/Music_Bot/linkParser";

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
                    { name: "Title", value: video.title ?? "No title" },
                    { name: "Channel", value: video.author ?? "No author" },
                    { name: "Length", value: video.duration ?? "0:00" },
                );
            if (video.thumbnailURL) {
                embed.setThumbnail(video.thumbnailURL);
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
                interaction.reply("No input found!");
                return;
            }
            player.addSongs(input);
        }
    },
};