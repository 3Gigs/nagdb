import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("mirror")
        .setDescription("Mirrors what you write")
        .addStringOption(option =>
            option.setName("input")
                .setDescription("The string to mirror")
                .setRequired(true)),
    async execute(interaction: CommandInteraction) {
        const input = interaction.options.getString("input");
        await interaction.reply(input as string);
    },
};