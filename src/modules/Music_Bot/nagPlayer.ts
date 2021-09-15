import {
    AudioPlayer,
    AudioPlayerStatus,
    createAudioResource,
    NoSubscriberBehavior,
    PlayerSubscription,
    VoiceConnection,
} from "@discordjs/voice";
import { stream } from "play-dl";
import { Video } from "play-dl/dist/YouTube/classes/Video";
import { dlog } from "../nagLogger";
import {
    parsePlaylist,
    songQueue,
} from "./songQueue";

/**
 * **Discord bot music player implementation**
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
    private subscription: PlayerSubscription;
    private songQueue: songQueue;
    private player: AudioPlayer;
    private willPlayAll = false;

    /**
     * Creates an instance of nagPlayer.
     * @param {string} input
     * @memberof nagPlayer
     */
    constructor(connection: VoiceConnection) {
        this.connection = connection;
        this.player = new AudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Play,
            },
        });
        this.subscription = this
            .connection
            .subscribe(this.player) as PlayerSubscription;
        this.songQueue = new songQueue();
    }

    /**
     * Add song to queue from link
     *
     * @param {string} url
     * @memberof nagPlayer
     * @throws An Error if cannot unable to create Song array
     */
    @dlog("debug", "Adding song to queue...")
    async addSongs(url: string): Promise<void> {
        // TODO: Add function for playing single music and playlists
        const songList = await parsePlaylist(url);
        if (songList) {
            for (let i = 0; i < songList.length; i++) {
                const song = songList[i];
                this.songQueue.enqueue(song);
            }
        }
        else {
            throw new Error("Cannot add song to queue!");
        }
    }

    /**
     * Play next Song from queue
     *
     * @memberof nagPlayer
     * @throws An Error if no song in queue
     */
    @dlog("debug", "Playing music from queue...")
    async nextSong(): Promise<Video> {
        const video = this.songQueue.dequeue();

        if (video) {
            const musicStream = createAudioResource(
                (await stream(video.url as string))
                    .stream);
            this.player.play(musicStream);
            return video;
        }
        else {
            throw new Error("No songs in queue");
        }
    }

    /**
     * Plays all music from queue, with optional callback function for
     * displaying current song playing
     *
     * @note Adds an event listener that plays Songs when AudioPlayer is Idle,
     * will remove itself when there's no songs in queue
     * @memberof nagPlayer
     * @callback {{function(vid_details: Song | undefined): void}}
     */
    async playAll(func: (song: Video | undefined) => void): Promise<void> {
        // Will not execute below this function already called
        if (!this.willPlayAll) {
            // Play current song
            const song = await this.nextSong();
            if (func) {func(song);}
            // Used for event callback below
            const callback = async () => {
                try {
                    const music = await this.nextSong();
                    if (func) {func(music);}
                }
                catch (error) {
                    this.willPlayAll = false;
                    this.player.removeListener(AudioPlayerStatus.Idle,
                        callback);
                    if (func) {func(undefined);}
                }
            };
            this.willPlayAll = true;
            this.player.on(AudioPlayerStatus.Idle, callback);
        }
    }

    @dlog("debug", "Skipping music")
    async skipMusic(): Promise<Video | undefined> {
        let song = undefined;
        Promise.resolve(this.nextSong())
            .then(() => { song = this.nextSong(); })
            .catch(() => {
                this.player.stop();
            });
        // TODO
        return song;
    }
}