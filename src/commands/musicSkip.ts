import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, 
        MessageEmbed } from "discord.js";
import { guildPlayers } from "../modules/Music_Bot/guildPlayers";
import { video_details } from "../modules/Music_Bot/songQueue";

function nowPlayingEmbedCreator(details: video_details): MessageEmbed {
    const embed =  new MessageEmbed()
    embed.setColor("AQUA")
        .setTitle("🎧 Now Playing!")
        .setThumbnail(details.thumbnail.url)
        .setURL(details.url)
        .addFields(
            { name: "Title", value: details.title },
            { name: "Channel", value: details.channel.name },
            { name: "Length", value: details.durationRaw }
        )
    return embed;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("skip")
        .setDescription("Skip currently playing music"),
    async execute(interaction: CommandInteraction) {
        const guild = interaction.guild;
        if(guild) {
            const player = guildPlayers.get(guild.id);
            if(!player) {
                await interaction.reply("Currently not connected to this " +
                "guild's voice channel!");
            }
            else {
                await interaction.reply("Skipping music...");
                const songDetails = player.skipMusic();
                if(songDetails) {
                    await interaction.editReply(
                        { embeds: [nowPlayingEmbedCreator(songDetails)] });
                }
            }
        } 
        else {
            await interaction.reply("Cannot find guild!");
        }
        // Automatically delete this message
        setTimeout(() => {interaction.deleteReply()}, 5_000);
    }
};