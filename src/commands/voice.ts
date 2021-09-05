import { SlashCommandBuilder } from "@discordjs/builders";
import { getVoiceConnection, joinVoiceChannel, VoiceConnection } from "@discordjs/voice";
import { CommandInteraction, GuildMember } from "discord.js";
import { nagLogger } from "../modules/nagLogger";
import { nagPlayer } from "../modules/Music_Bot/nagPlayer";

export /**
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
        await interaction.reply("Attempting to play music...");
        const input = interaction.options.getString("input");
        if(!input) {
            interaction.reply("Invalid input!");
            return;
        }

        if(interaction.guild !== null) {
            let connection = getVoiceConnection(interaction.guild.id);
            if(!connection) {
                connection = joinVC(interaction.member as GuildMember);
            }
            const player = new nagPlayer(connection);
            player.addSong(input);
        } 
        else {
            interaction.reply("You are not sending this from a valid Guild!");
        }
    },
};