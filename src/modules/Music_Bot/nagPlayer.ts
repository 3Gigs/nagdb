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
} from "@discordjs/voice";
import { VoiceChannel } from "discord.js";
import { easyLinkedList } from "easylinkedlist";
import { playlist_info,
    search,
    stream, video_basic_info,
    validate, Song } from "nagdl";

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
    private playingAll : boolean;
    private pausePlayer : boolean;
    private _nowPlaying: Song | undefined;
    private queue : easyLinkedList<Song>;

    /**
     * Creates an instance of nagPlayer with a specified VoiceChannel
     * @param {VoiceChannel} vc
     * @memberof nagPlayer
     */
    public constructor(vc : VoiceChannel) {
        this.vc = vc;
        this.subscription = undefined;
        this.playerMusic = undefined;
        this.queue = new easyLinkedList();
        this.playingAll = false;
        this.pausePlayer = false;
        this.joinChannel(vc);
    }

    get nowPlaying(): Song | undefined {
        return this.nowPlaying;
    }

    /**
     * Joins a voice channel. If a connection was already made, it will return
     * the instance from voiceConnections
     *
     * @return {*}  {(nagPlayer)}
     * @memberof nagPlayer
     */
    public joinChannel(vc : VoiceChannel): nagPlayer | undefined {
        if (nagPlayer.voiceConnections.has(vc)) {
            return nagPlayer.voiceConnections.get(vc);
        }
        else {
            joinVoiceChannel({
                channelId: vc.id,
                guildId: vc.guild.id,
                adapterCreator: vc.guild
                    .voiceAdapterCreator as DiscordGatewayAdapterCreator,
            });
            nagPlayer.voiceConnections.set(vc, this);
            return this;
        }
    }
    public getConnection(): VoiceConnection | undefined {
        return getVoiceConnection(this.vc.guild.id);
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
        this.getConnection()?.destroy();
        nagPlayer.voiceConnections.delete(this.vc);
        console.log(nagPlayer.getInstance(this.vc));
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
            this.subscription = this.getConnection()
                ?.subscribe(this.playerMusic);
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
        if (this.playingAll) {
            return;
        }
        const p = async () => {
            const song = this.queue.shift();
            this._nowPlaying = song;
            if (song && !this.pausePlayer) {
                this.playingAll = true;
                if (func) {
                    func(song);
                }
                const s = await stream(song.url);
                this.playSong(createAudioResource(s.stream, {
                    inputType: s.type,
                }));
            }
            else {
                this.pausePlayer = false;
                this.playingAll = false;
                this.subscription?.unsubscribe();
                this.subscription = undefined;
                this.playerMusic?.removeListener(AudioPlayerStatus.Idle, p);
                this.playerMusic = undefined;
            }
        };

        await p();
        this.playerMusic?.on(AudioPlayerStatus.Idle, async () => {
            p();
        });
        this.playerMusic?.on("error", (e) => {
            console.warn(e);
            p();
        });
    }

    /**
     * Checks if input is a link, and adds the songs to queue if it's a link
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
        if (reqType == "yt_playlist") {
            const pl = await playlist_info(request);
            await pl.fetch();
            for (let i = 1; i <= pl.total_pages; i++) {
                this.queue.push(...pl.page(i));
            }

            return true;
        }
        if (reqType == "yt_video") {
            const vid = (await video_basic_info(request)).video_details;
            this.queue.push(vid);
            return true;
        }
        return false;
    }
    public skipMusic(): void {
        if (!this.playingAll) {
            return;
        }
        // Destroys current audio resource, then sets the player to idle, which
        // signals the playAll event listener to play the next song
        this.playerMusic?.stop();
    }

    /**
     * Querys songs from the YouTubes
     * @param query - the search query
     * @return Array of videos found
     */
    public static async querySongs(query : string): Promise<Array<Song>> {
        return await search(query, { source: { youtube: "video" } });
    }
}