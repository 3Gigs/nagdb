import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, GuildMember } from "discord.js";
import { guildPlayers } from "../modules/Music_Bot/guildPlayers";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("skip")
        .setDescription("Skip currently playing music"),
    async execute(interaction: CommandInteraction) {
        const guild = interaction.guild;
        if(!guild) {
            await interaction.reply("Get find guild!");
            return;
        }
        const player = guildPlayers.get(guild.id);
        if(!player) {
            await interaction.reply("Currently not connected to this " +
            "guild's voice channel!");
            return;
        }
        await interaction.reply("Skipping music...");
        const songDetails = player.skipMusic();
        if(!songDetails) {
            await interaction.editReply("Reached end of song queue!");
        }
        else {
            await interaction.editReply("♫ Now playing ♫\n" 
                    + songDetails.url);
        }
    },
};