import {
    SlashCommandBuilder
} from "@discordjs/builders";
import {
    entersState,
    getVoiceConnection,
    joinVoiceChannel,
    VoiceConnection,
    VoiceConnectionStatus
} from "@discordjs/voice";
import {
    CommandInteraction,
    GuildMember,
    MessageEmbed
} from "discord.js";
import { nagPlayer } from "../modules/Music_Bot/nagPlayer";
import { guildPlayers } from "../modules/Music_Bot/guildPlayers";
import { nagLogger } from "../modules/nagLogger";
import { video_details } from "../modules/Music_Bot/songQueue";

/**
 * Re-usable function for making a now playing display
 *
 * @param {video_details} Details
 */
export const nowPlayingEmbedCreator = (details: video_details): MessageEmbed => {
        const embed =  new MessageEmbed()
        embed.setColor("AQUA")
            .setTitle("🎧 Now Playing!")
            .setThumbnail(details.thumbnail.url)
            .setURL(details.url)
            .addFields(
                { name: "Title", value: details.title },
                { name: "Channel", value: details.channel.name },
                { name: "Length", value: details.durationRaw }
            )
        return embed;
    }

/**
 * Joins VC
 *
 * @param {GuildMember} author
 * @return {*}  {VoiceConnection}
 */
const joinVC = function (author: GuildMember): VoiceConnection {
    if(!author.voice.channelId)
        throw new Error("Cannot find voice channelId!");
    const connection = joinVoiceChannel({
        channelId: author.voice.channelId as string,
        guildId: author.guild.id as string,
        adapterCreator: author.guild.voiceAdapterCreator
    })
    return connection;
}

module.exports = {
    nowPlayingEmbedCreator,
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Plays youtube audio given link or search query")
        .addStringOption(option =>
            option.setName("input")
                .setDescription("Link or search query")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("filter")
                .setDescription("Set FFMpeg filters")
                .setRequired(false)
        ),
    async execute(interaction: CommandInteraction) {
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
                        connection = joinVC(interaction.member as GuildMember);
                    }
                    catch (error) {
                        interaction.reply("You are not in a voice channel!");
                        return;
                    }
                    if (connection) {
                        // Register event for handling random disconnects
                        connection.on(VoiceConnectionStatus.Disconnected,
                            async (oldState, newState) => {
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
                                    (connection as VoiceConnection).destroy();
                                    nagLogger
                                        .getInstance()
                                        .log("debug", "Deleting nagPlayer " +
                                            "instance in " + guild.name);
                                    guildPlayers.delete(guild.id);
                                }
                            })
                    }
                }
                player = new nagPlayer(connection);
                guildPlayers.set(interaction.guild.id, player);
            }

            try {
                await player.addSongsFromLink(input);
                await interaction.reply("Adding songs to queue...")
            }
            catch (error) {
                interaction.reply("Could not add music to queue" +
                    " (Invalid Input?)");
                // Auto delete this message
                setTimeout(() => { interaction.deleteReply() }, 5_000)
                return;
            }
            player.playAll((details) => {
                // Continue to display song information until there's no more
                if (details) {
                    interaction.editReply(
                        { embeds: [nowPlayingEmbedCreator(details)] });
                }
                else {
                    interaction.editReply("No more songs in queue....");
                    // Auto delete this message
                    setTimeout(() => { interaction.deleteReply() }, 5_000)
                }
            })
        }
        else {
            interaction.followUp("You are not sending this from a valid" +
                "Guild!");
        }
    },
};