
import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { deployLocal } from "../deploy-commands"

module.exports = {
    data: new SlashCommandBuilder()
        .setName("reload")
        .setDescription("Hot reload all commands"),
    async execute(interaction: CommandInteraction) {
        await interaction.reply("Pong!");
        deployLocal();
    },
};