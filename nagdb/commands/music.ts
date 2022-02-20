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

const PAGE_SIZE = 10;
/**
 * Re-usable function for making a now playing display
 *
 * @param {video_details} Details
 */
export const nowPlayingEmbedCreator =
    (video: Song): MessageEmbed => {
        if (video) {
            const embed = new MessageEmbed();
            embed.setColor("GREEN")
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
            if (video.duration) {
                embed.addFields({
                    name: "Duration",
                    value: video.duration.durationFormatted,
                });
            }

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
                        .setRequired(true)
                        .setDescription("A YouTube link or search query")))
        .addSubcommand(subcommand =>
            subcommand
                .setName("nowplaying")
                .setDescription("View currently playing song"))
        .addSubcommand(subcommand =>
            subcommand
                .setName("queue")
                .setDescription("The music bot's queue")
                .addIntegerOption(option =>
                    option
                        .setName("page")
                        .setDescription(`Gets ${PAGE_SIZE} songs from the 
                        queue, starting at the page number 1`)
                        .setRequired(true)))
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
        const vc = (interaction.member as GuildMember).voice.channel;
        if (!(vc instanceof VoiceChannel)) {
            await interaction.reply("You're not in a valid voice channel!");
            return;
        }
        let player = nagPlayer.getInstance(vc.guildId);
        if (!player) {
            player = new nagPlayer(vc);
        }

        if (interaction.options.getSubcommand() === "play") {
            const input = interaction.options.getString("input");
            if (!input) {
                await interaction.reply("No input found!");
                return;
            }
            interaction.deferReply();
            // If input is not a link
            if (!await player.addSongsFromUrl(input)) {
                await interaction.followUp("Not a link!");
            }
            else {
                await interaction.followUp("Added songs to queue");
            }
            await player.playQueue();
        }
        else if (interaction.options.getSubcommand() === "nowplaying") {
            if (!player.nowPlaying) {
                await interaction.editReply("No songs playing!");
                return;
            }
            interaction.reply({ embeds:
                [nowPlayingEmbedCreator(player.nowPlaying)] });
        }
        else if (interaction.options.getSubcommand() === "skip") {
            if (!player.queue.length) {
                await interaction.deferReply();
                await interaction.editReply("Queue is empty!");
            }
            else {
                await interaction.deferReply();
                await interaction.editReply("Skipping song...");
            }
            player.skipMusic();
        }
        else if (interaction.options.getSubcommand() === "stop") {
            await interaction.deferReply();
            await interaction.editReply("Stopping player");
            player.leaveChannel();
        }
        else if (interaction.options.getSubcommand() === "queue") {
            const page = interaction.options.getInteger("page");
            if (!page) {
                console.warn("Page passed was null!");
                interaction.reply({ embeds: [new MessageEmbed()
                    .setTitle("❌ Invalid page number")] });
                return;
            }
            const songList = player.getQueuePaginated(page, PAGE_SIZE);
            if (!songList) {
                interaction.reply({ embeds: [new MessageEmbed()
                    .setTitle("❌ Invalid page number")] });
                return;
            }
            const queueEmbed = new MessageEmbed()
                .setTitle("Queue (Page " + page + " of "
                    + Math.ceil((player.queue.length / PAGE_SIZE)) + ")")
                .setColor("AQUA");
            for (const song of songList) {
                const title = song.title ? song.title : "Untitled Track";
                const author = song.author ? song.author : "No author";
                queueEmbed.addField(title, author);
            }
            interaction.reply({ embeds: [queueEmbed] });

            return;
        }
    },
};
