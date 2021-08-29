import { SlashCommandBuilder } from "@discordjs/builders";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Replies with pong"),
    async execute(interaction: any) {
        await interaction.reply("Pong!");
        typeof(interaction)
    },
};