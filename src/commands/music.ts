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
import { Song } from "nagdl";

/**
 * Re-usable function for making a now playing display
 *
 * @param {video_details} Details
 */
export const nowPlayingEmbedCreator =
    (video: Song): MessageEmbed => {
        if (video) {
            const embed = new MessageEmbed();
            embed.setColor("AQUA")
                .setTitle("🎧 Now Playing!");
            if (video.albumName) {
                embed.addFields({ name: "Album", value: video.albumName });
            }
            if (video.title) {
                embed.addFields({ name: "Title", value: video.title });
            }
            if (video.author) {
                embed.addFields({ name: "Author", value: video.author });
            }
            if (video.thumbnailUrl) {
                embed.setThumbnail(video.thumbnailUrl);
            }
            embed.addFields({
                name: "Duration", value: video.duration.durationFormatted,
            });


            embed.setURL(video.url);
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
                .setDescription("Stops music player and disconnect from " +
                    "voice channel")),
    async execute(interaction: CommandInteraction) {
        const vc = (interaction.member as GuildMember)
            .voice.channel as VoiceChannel;
        let player;
        if (nagPlayer.hasInstance(vc)) {
            player = nagPlayer.getInstance(vc);
        }
        else {
            player = new nagPlayer(vc);
        }
        if (!player) {
            interaction.reply("You're not in a voice channel!");
            return;
        }

        if (interaction.options.getSubcommand() === "play") {
            const input = interaction.options.getString("input");
            if (!input) {
                await interaction.reply("No input found!");
                return;
            }

            // If input is not a link
            if (!await player.addSongsFromUrl(input)) {
                await interaction.reply("Not a link!");
            }
            else {
                await interaction.reply("Adding songs to queue");
            }
            await player.playQueue((song) => {
                interaction.followUp({
                    embeds: [nowPlayingEmbedCreator(song)],
                });
            });
        }
        else if (interaction.options.getSubcommand() === "skip") {
            interaction.reply("Skipping song...");
            const p = nagPlayer.getInstance((interaction.member as GuildMember)
                .voice.channel as VoiceChannel);
            p?.skipMusic();
        }
        else if (interaction.options.getSubcommand() === "stop") {
            interaction.reply("Stopping player");
            const p = nagPlayer.getInstance((interaction.member as GuildMember)
                .voice.channel as VoiceChannel);
            p?.leaveChannel();
        }
    },
};