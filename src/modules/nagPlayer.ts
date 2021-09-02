import { AudioPlayer, 
        AudioResource, 
        NoSubscriberBehavior, 
        VoiceConnection } from "@discordjs/voice";
import { joinVoiceChannel } from "@discordjs/voice";
import { GuildMember } from "discord.js";
import { nagLogger } from "./nagLogger";
import playdl from "play-dl"
import { Stream, 
        LiveStreaming, 
        LiveEnded } from "play-dl/dist/YouTube/classes/LiveStream";
import { PlayList } from "play-dl/dist/YouTube/classes/Playlist";

/**
 * Simple songQueue implementation
 *
 * @export
 * @class songQueue
 */
export class songQueue {
    private queue: Array<AudioResource>;

    public constructor() {
        this.queue = [];
    }

    /**
     * Add a AudioResource to queue
     * 
     * @param music Djs/Voice AudioResource to add
     * @returns New length of array, or undefined 
     */
    public enqueue(music: AudioResource): number | undefined {
        const result =  this.queue.push(music);
        return result ? result : undefined;
    }
    /**
     * Dequeue a AudioResource from queue
     * 
     * @returns Next Djs/Voice AudioResource to play
     */
    public dequeue(): AudioResource | undefined {
        const result = this.queue.shift();
        return result ? result : undefined;
    }
}

/**
 * Discord bot music player implementation
 *
 * @export
 * @class nagPlayer
 */
export class nagPlayer {
    /**
     * The Discord bot's audio player
     *
     * @type {AudioPlayer}
     * @memberof nagPlayer
     * 
     */
    private connection: VoiceConnection | undefined;
    private songQueue: songQueue;
    private player: AudioPlayer;

    /**
     * Creates an instance of nagPlayer.
     * @param {string} input
     * @memberof nagPlayer
     */
    constructor() {
        this.player = new AudioPlayer( {
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Play
            }
        })
        this.songQueue = new songQueue();
    }

    /**
     * Join Voice Channel
     *
     * @param {GuildMember} author
     * @return {*}  {VoiceConnection}
     * @memberof nagPlayer
     */
    @nagLogger.getInstance().log("debug", "Joining voice channel")
    joinVC(author: GuildMember): VoiceConnection {
        this.connection = joinVoiceChannel({
            channelId: author.voice.channelId as string,
            guildId: author.guild.id as string,
            adapterCreator: author.guild.voiceAdapterCreator
        })
        return this.connection;
    }

    /**
     * Adds song to queue
     *
     * @param {string} input
     * @memberof nagPlayer
     */
    @nagLogger.getInstance().log("debug", "Adding song to queue...")
    async addSong(music: AudioResource) {
        this.songQueue.enqueue(music);
    }
}