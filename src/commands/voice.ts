import { SlashCommandBuilder } from "@discordjs/builders";
import { getVoiceConnection, 
        joinVoiceChannel, 
        VoiceConnection } from "@discordjs/voice";
import { CommandInteraction, 
        GuildMember } from "discord.js";
import { nagLogger } from "../modules/nagLogger";
import { nagPlayer } from "../modules/Music_Bot/nagPlayer";
import { guildPlayers } from "../modules/Music_Bot/guildPlayers";


/**
 * Joins VC
 *
 * @param {GuildMember} author
 * @return {*}  {VoiceConnection}
 */
export const joinVC = function (author: GuildMember): VoiceConnection {
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
            return;
        }

        if(interaction.guild !== null) {
            let player = guildPlayers.get(interaction.guild.id);
            if(!player) {
                let connection = getVoiceConnection(interaction.guild.id);
                if(!connection) {
                    connection =  joinVC(interaction.member as GuildMember);
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
                        interaction.editReply("♫ Now playing ♫\n" + 
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
    },
};