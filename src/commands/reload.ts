import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { commandHandler } from "../commandHandler";
import { deployLocal } from "../deploy-commands"

module.exports = {
    data: new SlashCommandBuilder()
        .setName("reload")
        .setDescription("Hot reload all commands"),
    execute(interaction: CommandInteraction) {
        interaction.reply("Reloading commands")
                .then(() => {
                    commandHandler.getInstance().refreshCommandDir();
                })
                .then(() => {
                    interaction.editReply("Commands reloaded!");
                })
                .then(() => {
                    // Auto-delete interaction
                    setTimeout(() => {
                        interaction.deleteReply();
                    }, 5_000);
                })
                .catch((error) => {
                    throw new Error(error);
                });

    },
};