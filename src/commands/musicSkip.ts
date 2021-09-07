import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { guildPlayers } from "../modules/Music_Bot/guildPlayers";
import { nowPlayingEmbedCreator } from "./musicPlay";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("skip")
        .setDescription("Skip currently playing music"),
    async execute(interaction: CommandInteraction) {
        const guild = interaction.guild;
        if (guild) {
            const player = guildPlayers.get(guild.id);
            if (!player) {
                await interaction.reply("Currently not connected to this " +
                "guild's voice channel!");
            }
            else {
                await interaction.reply("Skipping music...");
                const songDetails = player.skipMusic();
                if (songDetails) {
                    await interaction.editReply(
                        { embeds: [nowPlayingEmbedCreator(songDetails)] });
                }
            }
        }
        else {
            await interaction.reply("Cannot find guild!");
        }
    },
};