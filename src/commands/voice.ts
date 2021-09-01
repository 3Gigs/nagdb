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


export const joinVC = (author: GuildMember): VoiceConnection  => {
    console.log("Joining voice channel...");
    const connection = joinVoiceChannel({
        channelId: author.voice.channelId as string,
        guildId: author.guild.id as string,
        adapterCreator: author.guild.voiceAdapterCreator
    })
    return connection;
}

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
    /*
    if(!music) {
        console.error("Audio resource invalid");
    }
    player.play(music);
    setTimeout(() => {player.stop(); console.log("Player stopped")}, 5_000);
    const subscription = connection.subscribe(player);
    if(subscription === undefined) {
        console.error("Cannot subscribe to voice connnection")
        return;
    }
    */
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
        const input = interaction.options.getString("input");
        const connection = joinVC(interaction.member as GuildMember);
        const subscription = connection.subscribe(player);
        if(input && subscription) {
            playMusic(connection, player, subscription, input);
        }
        await interaction.reply("Attempting to play music...");
    },
};