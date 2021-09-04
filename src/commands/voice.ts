import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, GuildMember } from "discord.js";
import { joinVoiceChannel, AudioPlayer, VoiceConnection, 
         createAudioResource, AudioPlayerStatus,
         entersState, 
         AudioResource,
         VoiceConnectionStatus,
         NoSubscriberBehavior,
         PlayerSubscription} from "@discordjs/voice"
import {stream as ytdl} from "play-dl"

export const playMusic = async (connection: VoiceConnection, 
            player: AudioPlayer, subscription: PlayerSubscription, input: string) => {
    const stream = await ytdl(input);
    let music: AudioResource | undefined = undefined;

    if(stream) {
        music = createAudioResource(stream.stream, {
            inlineVolume: true, inputType: stream.type
        });
    }else {
        console.error("Cannot load music stream");
        return;
    }
    if(subscription) {
        console.log("Subscribed to voice connection!")
    } else {
        console.error("Cannot subscribe to voice connection!");
        return;
    }

    await player.play(music);
    try {
        await entersState(player, AudioPlayerStatus.Playing, 5_000);
        console.log("Playing music!");
    }
    catch (error) {
        console.log(error);
    }
    player.on("error", (error) => {
        console.error(error);
    })
    setTimeout(() => {player.stop(); console.log("Player stopped")}, 5_000);
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
        const player = new AudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Play
            }
        });
        await interaction.reply("Attempting to play music...");
    },
};