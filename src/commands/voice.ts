import { SlashCommandBuilder } from "@discordjs/builders";
import { entersState, 
        getVoiceConnection, 
        joinVoiceChannel, 
        VoiceConnection, 
        VoiceConnectionStatus} from "@discordjs/voice";
import { CommandInteraction, 
        GuildMember } from "discord.js";
import { nagPlayer } from "../modules/Music_Bot/nagPlayer";
import { guildPlayers } from "../modules/Music_Bot/guildPlayers";


/**
 * Joins VC
 *
 * @param {GuildMember} author
 * @return {*}  {VoiceConnection}
 */
const joinVC = function (author: GuildMember): VoiceConnection {
    const connection = joinVoiceChannel({
        channelId: author.voice.channelId as string,
        guildId: author.guild.id as string,
        adapterCreator: author.guild.voiceAdapterCreator
    })
    return connection;
}

module.exports = {
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
        if(!input) {
            interaction.reply("Invalid input!");
        }
        else if(interaction.guild !== null) {
            const guild = interaction.guild;
            let player = guildPlayers.get(interaction.guild.id);
            if(!player) {
                let connection = getVoiceConnection(guild.id);
                if(!connection) {
                    connection = joinVC(interaction.member as GuildMember);
                    if(connection) {
                        // Register event for handling random disconnects
                        connection.on(VoiceConnectionStatus.Disconnected, 
                            async (oldState, newState) => {
                            try {
                                await Promise.race([
                                    entersState(connection as VoiceConnection, 
                                            VoiceConnectionStatus.Signalling,
                                            5_000),
                                    entersState(connection as VoiceConnection, 
                                            VoiceConnectionStatus.Connecting, 
                                            5_000),
                                ]);
                            }
                            catch (error) {
                                (connection as VoiceConnection).destroy();
                                guildPlayers.delete(guild.id);
                            }
                        })
                    }
                }
                player = new nagPlayer(connection);
                guildPlayers.set(interaction.guild.id, player);
            }

            try {
                await player.addSongs(input);
                await interaction.reply("Adding songs to queue...") 
            }
            catch(error) {
                interaction.editReply("Could not add music to queue!")
                console.error(error);
            }
            player.playAll((details) => {
                if(details) {
                        interaction.editReply("**♫ Now playing ♫**\n" + 
                        details.url);
                }
                else {
                    interaction.editReply("No more songs in queue....");
                }
            })
        } 
        else {
            interaction.followUp("You are not sending this from a valid" +
                    "Guild!");
        }
        // Auto delete this message
        setTimeout(() => {interaction.deleteReply()}, 5_000)
    },
};