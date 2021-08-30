import { channelMention, SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, GuildMember } from "discord.js";
import { joinVoiceChannel } from "@discordjs/voice"
import { getVoiceConnection } from "@discordjs/voice"
import process from "process"

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

        (() => {
            const author = interaction.member as GuildMember;
            console.log("Joining voice channel...");
            const channel = joinVoiceChannel({
                channelId: author.voice.channelId as string,
                guildId: author.guild.id as string,
                adapterCreator: author.guild.voiceAdapterCreator
            })
        })();
        process.on("SIGTERM", () => {
            console.log("Clean up hanging voice connection");
            (() => {
                const guildId: string = interaction.guildId as string;
                const connection = getVoiceConnection(guildId);
                if(connection !== undefined) {
                    connection.destroy();
                }
            })();
        })
    },
};