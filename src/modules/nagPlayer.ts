import { AudioPlayer, 
        AudioResource, 
        createAudioResource, 
        NoSubscriberBehavior, 
        VoiceConnection } from "@discordjs/voice";
import { joinVoiceChannel } from "@discordjs/voice";
import { GuildMember  } from "discord.js";
import { nagLogger } from "./nagLogger";
import { validate, 
        validate_playlist, 
        stream, 
        video_info, 
        playlist_info} from "play-dl"
import { Stream, 
        LiveStreaming, 
        LiveEnded } from "play-dl/dist/YouTube/classes/LiveStream";
import { PlayList } from "play-dl/dist/YouTube/classes/Playlist";

/**
 * See play-dl's video_details
 *
 * @export
 * @interface video_details
 */
export interface video_details {
    id: any;
    url: string;
    title: any;
    description: any;
    durationInSec: any;
    durationRaw: string;
    uploadedDate: any;
    thumbnail: any;
    channel: {
        name: any;
        id: any;
        url: string;
        verified: boolean;
    };
    views: any;
    tags: any;
    averageRating: any;
    live: any;
    private: any;
}

export interface Song {
    resource: AudioResource,
    songDetails: video_details
}

/**
 * Simple songQueue implementation
 *
 * @export
 * @class songQueue
 */
export class songQueue {
    private queue: Array<Song>;

    public constructor() {
        this.queue = [];
    }

    /**
     * Add a AudioResource to queue
     * 
     * @param music Djs/Voice AudioResource to add
     * @returns New length of array, or undefined 
     */
    public enqueue(music: Song): number | undefined {
        const result =  this.queue.push(music);
        return result ? result : undefined;
    }
    /**
     * Dequeue a AudioResource from queue
     * 
     * @returns Next Djs/Voice AudioResource to play
     */
    public dequeue(): Song | undefined {
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
     * Adds a song to queue, can directly pass a Song object or a url link
     *
     * @param {string} input
     * @memberof nagPlayer
     */
    addSong(music: Song): Song;
    addSong(url: string): Song; 
    @nagLogger.getInstance().log("debug", "Adding song to queue...")
    addSong(overload: any): any {
        if(typeof overload === "string") {
            CreateSongFromLink(overload);
        }
        if(typeof overload !== "undefined") {
            this.songQueue.enqueue(overload);
        }
    }

    /**
     * Play music from queue
     *
     * @memberof nagPlayer
     * @throws An Error if no song in queue
     */
    @nagLogger.getInstance().log("debug", "Playing music from queue...")
    playMusic() {
        const song = this.songQueue.dequeue();

        if(song) {
            this.player.play(song.resource);
        } 
        else {
            throw new Error("No songs in queue")
        }

        return song;
    }

    @nagLogger.getInstance().log("debug", "Skipping music")
    skipMusic(): Song | undefined {
        if(this.player.stop()) {
            return this.playMusic();
        }
        else {
            throw new Error("Error while skipping music");
        }
    }
}

/**
 * Create a song or songlist from a youtube-dl supported link
 *
 * @export
 * @param {string} input
 * @return {*}  {(Song | SongList)}
 */
export async function CreateSongFromLink (input: string): 
        Promise<Song | 
        PlayList | 
        undefined> 
{
    if(validate(input)) {
        const songDetails: video_details = (await video_info(input)).
                video_details;
        try {
            const musicStream = await stream(input);
            const resource = createAudioResource(musicStream.stream, 
                        {inputType: musicStream.type});
            const song: Song = {
                resource,
                songDetails
            }
            return song;
        }
        catch (error) {
            throw new Error("Error while trying to stream YouTube Link")
        }
    }
    else if(validate_playlist(input)) {
        let playlist: PlayList | undefined;

        try {
            playlist = await playlist_info(input);
        }
        catch (error) {
           throw new Error("Error while processing a YouTube playlist");
       }

        return playlist;
    }
}
