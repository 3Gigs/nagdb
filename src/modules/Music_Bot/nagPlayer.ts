import { AudioPlayer, 
        NoSubscriberBehavior, 
        VoiceConnection } from "@discordjs/voice";
import { nagLogger } from "../nagLogger";
import { songQueue } from "./songQueue";


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
    private connection: VoiceConnection;
    private songQueue: songQueue;
    private player: AudioPlayer;

    /**
     * Creates an instance of nagPlayer.
     * @param {string} input
     * @memberof nagPlayer
     */
    constructor(connection: VoiceConnection) {
        this.connection = connection;
        this.player = new AudioPlayer( {
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Play
            }
        })
        this.songQueue = new songQueue();
    }

    /**
     * Play one Song from queue
     *
     * @memberof nagPlayer
     * @throws An Error if no song in queue
     */
    @nagLogger.getInstance().log("debug", "Playing music from queue...")
    playMusic() {
        const song = this.songQueue.dequeue();

        if(song) {
            this.connection.subscribe(this.player);
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
