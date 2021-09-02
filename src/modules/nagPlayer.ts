/** @module DPlayer */
import { AudioPlayer, 
        NoSubscriberBehavior, 
        VoiceConnection } from "@discordjs/voice";
import { joinVoiceChannel } from "@discordjs/voice";
import { GuildMember } from "discord.js";
import { nagLogger } from "./nagLogger";

/**
 * Discord bot music player implementation
 *
 * @export
 * @class DPlayer
 */
export class nagPlayer {
    /**
     * The Discord bot's audio player
     *
     * @type {AudioPlayer}
     * @memberof DPlayer
     * 
     */
    private connection: VoiceConnection | undefined;
    private player: AudioPlayer;

    /**
     * Creates an instance of DPlayer.
     * @param {string} input
     * @memberof DPlayer
     */
    constructor() {
        this.player = new AudioPlayer( {
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Play
            }
        })
    }

    @nagLogger.getInstance().log("debug", "Joining voice channel")
    joinVC(author: GuildMember): VoiceConnection {
        const connection = joinVoiceChannel({
            channelId: author.voice.channelId as string,
            guildId: author.guild.id as string,
            adapterCreator: author.guild.voiceAdapterCreator
        })
        return connection;
    }
}