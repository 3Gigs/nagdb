import {
    AudioPlayer,
    AudioPlayerStatus,
    AudioResource,
    createAudioPlayer,
    createAudioResource,
    DiscordGatewayAdapterCreator,
    getVoiceConnection,
    joinVoiceChannel,
    NoSubscriberBehavior,
    PlayerSubscription,
    VoiceConnection,
    VoiceConnectionStatus,
    entersState,
} from "@discordjs/voice";
import { VoiceChannel } from "discord.js";
import { playlist_info,
    search,
    stream,
    video_basic_info,
    validate,
    Song,
    spotify,
    SpotifyTrack,
    SpotifyPlaylist,
    SpotifyAlbum,
    refreshToken,
    is_expired } from "nagdl";

/**
 * **Discord voice channel bot music player implementation**
 *
 * @export
 * @class nagPlayer
 */
export class nagPlayer {
    private static voiceConnections = new Map<VoiceChannel, nagPlayer>();
    private vc: VoiceChannel;
    private subscription : PlayerSubscription | undefined;
    private playerMusic : AudioPlayer | undefined;
    private playingQueue : boolean;
    private pausePlayer : boolean;
    private _nowPlaying: Song | undefined;
    private _queue : Array<Song>;

    /**
     * Creates an instance of nagPlayer with a specified VoiceChannel
     * @param {VoiceChannel} vc
     * @memberof nagPlayer
     */
    public constructor(vc : VoiceChannel) {
        this.vc = vc;
        this.subscription = undefined;
        this.playerMusic = undefined;
        this._queue = [];
        this.playingQueue = false;
        this.pausePlayer = false;
        this.joinChannel(vc);
    }

    get nowPlaying(): Song | undefined {
        return this._nowPlaying;
    }

    /**
     * @returns True if bot is attempting to play all of queue
     */
    get isPlayingQueue(): boolean {
        return this.playingQueue;
    }

    get queue(): Song[] {
        return this._queue;
    }

    get connection(): VoiceConnection | undefined {
        return getVoiceConnection(this.vc.guild.id);
    }
    /**
     * Joins a voice channel. If a connection was already made, it will return
     * the instance from voiceConnections
     *
     * @return {*}  {(nagPlayer)}
     * @memberof nagPlayer
     */
    private joinChannel(vc : VoiceChannel): nagPlayer | undefined {
        let connection: VoiceConnection;

        if (nagPlayer.voiceConnections.has(vc)) {
            return nagPlayer.voiceConnections.get(vc);
        }
        else {
            connection = joinVoiceChannel({
                channelId: vc.id,
                guildId: vc.guild.id,
                adapterCreator: vc.guild
                    .voiceAdapterCreator as DiscordGatewayAdapterCreator,
            });
            nagPlayer.voiceConnections.set(vc, this);
            connection.on(VoiceConnectionStatus.Disconnected, async () => {
                try {
                    await Promise.race([
                        entersState(
                            connection,
                            VoiceConnectionStatus.Signalling,
                            5_000),
                        entersState(
                            connection,
                            VoiceConnectionStatus.Connecting,
                            5_000),
                    ]);
                }
                catch (e) {
                    connection.destroy();
                    nagPlayer.voiceConnections.delete(vc);
                }
            });
            return this;
        }
    }

    /**
     * Gives a portion a portion of the queue,
     * based on given page size and page number
     * @param page - The page number
     * @param page_size - The page size, used to paginate the queue
     *
     * @returns An array of Songs on given page
     *
    */
    public getQueuePaginated(page: number, page_size: number)
    : Array<Song> | undefined {
        console.log("Page: " + page);
        if (page > Math.ceil(this.queue.length / page_size) || page <= 0) {
            return undefined;
        }
        return this.queue.slice((page - 1) * page_size, page * page_size);
    }

    /**
     * @param vc The voice channel
     * @returns True if an instance of nagPlayer
     * already exists for voice channel
     */
    public static hasInstance(vc: VoiceChannel): boolean {
        if (nagPlayer.voiceConnections.has(vc)) {
            return true;
        }
        else {
            return false;
        }
    }

    /**
     * Get the voice channel's nagPlayer instance, if it exists
     * @param vc The voice channel
     * @returns The nagPlayer instance, or undefined if it doesn't exist
     */
    public static getInstance(vc: VoiceChannel): nagPlayer | undefined {
        if (nagPlayer.voiceConnections.has(vc)) {
            return nagPlayer.voiceConnections.get(vc);
        }
        else {
            return undefined;
        }
    }

    /**
     * Destroys the voice connection, and deletes this instance
     * off of voiceConnections
     *
     * @memberof nagPlayer
     */
    public leaveChannel(): nagPlayer {
        this.connection?.destroy();
        nagPlayer.voiceConnections.delete(this.vc);
        return this;
    }

    /**
     * Plays the specified audio resource
     *
     * @param {AudioResource} resource
     * @memberof nagPlayer
     */
    private playSong(resource: AudioResource): void {
        if (!this.playerMusic) {
            this.playerMusic = createAudioPlayer({
                behaviors: {
                    noSubscriber: NoSubscriberBehavior.Play,
                },
            });
        }
        if (!this.subscription) {
            this.subscription = this.connection?.subscribe(this.playerMusic);
        }
        this.playerMusic.play(resource);
    }

    /**
     * Plays all music from queue, with optional callback function for
     * displaying current song playing
     * @example
     * ```js
     * player.playQueue((song) => {
     *     interaction.followup("Now playing: " + song.title);
     * });
     * ```
     * @remarks
     * Note that the above example only works if the queue is shorter than 15
     * minutes, otherwise the interaction will expire
     *
     * @param func - Executes every time a new song will be played
     * @memberof nagPlayer
     */
    public async playQueue(func? : (song: Song) => void) : Promise<void> {
        if (this.playingQueue) {
            return;
        }
        const p = async () => {
            const song = this._queue.shift();
            this._nowPlaying = song;
            if (song && !this.pausePlayer) {
                this.playingQueue = true;
                if (func) {
                    func(song);
                }
                if (await validate(song.url)) {
                    try {
                        const s = await stream(song.url);
                        this.playSong(createAudioResource(s.stream, {
                            inputType: s.type,
                        }));
                    }
                    catch (e) {
                        console.log(e);
                        p();
                    }
                }
                else {
                    console.log("Skipped invalid song link...");
                    return;
                }
            }
            else {
                this.pausePlayer = false;
                this.playingQueue = false;
                this.subscription?.unsubscribe();
                this.subscription = undefined;
                this.playerMusic?.removeListener(AudioPlayerStatus.Idle, p);
                this.playerMusic = undefined;
            }
        };

        // Refresh token if needed
        if (is_expired()) {
            refreshToken();
        }
        await p();
        this.playerMusic?.on(AudioPlayerStatus.Idle, async () => {
            if (is_expired()) {
                await refreshToken();
            }
            p();
        });
        this.playerMusic?.on("error", (e) => {
            console.warn(e);
            p();
        });
    }

    /**
     * Checks if input is a link, and adds the tracks to queue if it's a link
     *
     * @param request - The input
     * @return true if song(s) were added to queue, false otherwise
     * @memberof nagPlayer
     */
    async addSongsFromUrl(request : string): Promise<boolean> {
        const reqType = await validate(request);
        if (!reqType) {
            return false;
        }
        switch (reqType) {
        case "yt_playlist": {
            try {
                const pl = await playlist_info(request);
                await pl.fetch();
                for (let i = 1; i <= pl.total_pages; i++) {
                    this._queue.push(...pl.page(i));
                }
                return true;
            }
            catch (e) {
                console.log(e);
                return false;
            }
        }
        case "yt_video": {
            const vid = (await video_basic_info(request)).video_details;
            this._queue.push(vid);
            return true;
        }
        case "sp_track": {
            // Refresh token if needed
            if (is_expired()) {refreshToken();}
            const spData = await spotify(request);
            if (spData instanceof SpotifyTrack) {
                const title = spData.title ? spData.title : "Untitled Track";
                const author = spData.author ? spData.author : "Unknown Author";
                const link = (await search(`${title} ${author}`,
                    { limit: 1 }))[0].url;
                const song = { title, author, url: link };
                this._queue.push(song);
                return true;
            }
            return false;
        }
        case "sp_playlist":
        case "sp_album":
            // eslint-disable-next-line no-case-declarations
            const spData = await spotify(request);
            if (spData instanceof SpotifyAlbum
                || spData instanceof SpotifyPlaylist) {
                await spData.fetch();
                for (let i = 1; i <= spData.total_pages; i++) {
                    const tracks: Song[] | undefined = spData.page(i);
                    if (tracks) {
                        await Promise.all(tracks.map(async t => {
                            const title = t.title ? t.title : "Untitled Track";
                            const author = t.author
                                ? t.author : "Unknown author";
                            const album = t.albumName
                                ? t.albumName : "No album";
                            const result: string | undefined =
                                (await search(`${title} ${author}`,
                                    { limit: 1 }))[0]?.url;
                            if (result) {
                                const song: Song = {
                                    url: result,
                                    albumName: album,
                                    title: title,
                                    author,
                                };
                                this._queue.push(song);
                                return t;
                            }
                        }));
                    }
                }
                return true;
            }
            return false;
        default: {
            return false;
        }
        }
    }
    public skipMusic(): void {
        if (!this.playingQueue) {
            return;
        }
        // Destroys current audio resource, then sets the player to idle, which
        // signals the playAll event listener to play the next song
        this.playerMusic?.stop();
    }

    /**
     * Querys tracks from the YouTubes
     * @param query - the search query
     * @return Array of videos found
     */
    public static async queryTracks(query : string): Promise<Array<Song>> {
        return await search(query, { source: { youtube: "video" } });
    }
}
