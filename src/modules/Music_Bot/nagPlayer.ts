import {
    AudioPlayer,
    AudioPlayerStatus,
    AudioResource,
    createAudioPlayer,
    createAudioResource,
    DiscordGatewayAdapterCreator,
    joinVoiceChannel,
    NoSubscriberBehavior,
    PlayerSubscription,
    StreamType,
    VoiceConnection,
} from "@discordjs/voice";
import { VoiceChannel } from "discord.js";
import { easyLinkedList } from "easylinkedlist";
import { playlist_info,
    stream, video_basic_info, YouTubeChannel,
    yt_validate } from "play-dl";

/**
 * **Discord voice channel bot music player implementation**
 *
 * @export
 * @class nagPlayer
 */
export class nagPlayer {
    private static voiceConnections = new Map<VoiceChannel, nagPlayer>();
    private connection: VoiceConnection | undefined;
    private subscription : PlayerSubscription | undefined;
    private playerMusic : AudioPlayer | undefined;
    private playingAll : boolean;
    private queue : easyLinkedList<nagVideo>;

    /**
     * Creates an instance of nagPlayer with a specified VoiceChannel
     * @param {VoiceChannel} vc
     * @memberof nagPlayer
     */
    public constructor(vc : VoiceChannel) {
        this.connection = this.joinChannel(vc)?.connection;
        this.queue = new easyLinkedList();
        this.playingAll = false;
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
            this.connection = joinVoiceChannel({
                channelId: vc.id,
                guildId: vc.guild.id,
                adapterCreator: vc.guild
                    .voiceAdapterCreator as DiscordGatewayAdapterCreator,
            });
            return this;
        }
    }
    public getConnection(): VoiceConnection | undefined {
        return this.connection;
    }

    /**
     * Destroys the voice connection, and deletes this instance
     * off of voiceConnections
     *
     * @memberof nagPlayer
     */
    public leaveChannel(): nagPlayer {
        this.connection?.destroy;
        return this;
    }

    /**
     * Subscribes to connection to an audio player
     *
     * @param {AudioPlayer} player
     * @return {*}  {(PlayerSubscription | undefined)}
     * @memberof nagPlayer
     */
    private subscribeAudio(player : AudioPlayer):
    PlayerSubscription | undefined {
        this.subscription = this.connection?.subscribe(player);
        return this.subscription;
    }

    /**
     * Plays the specified audio resource
     *
     * @param {AudioResource} resource
     * @memberof nagPlayer
     */
    public playSong(resource: AudioResource): void {
        this.playerMusic = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Play,
            },
        });
        if (!this.subscription) {
            this.subscription = this.connection?.subscribe(this.playerMusic);
            this.playerMusic.play(resource);
        }
    }

    /**
     * Plays all music from queue, with optional callback function for
     * displaying current song playing
     *
     * @param func - Executes every time a new song will be played
     * @memberof nagPlayer
     */
    public async playAll(func? : (song: nagVideo) => void) : Promise<void> {
        if (this.playingAll) {
            return;
        }
        this.playingAll = true;
        const p = async () => {
            const song = this.queue.shift();
            if (song) {
                console.log("Playing " + song.title);
                if (func) {
                    func(song);
                }
                const s = await stream(song.streamUrl);
                console.log("Playing song NOW!!!");
                this.playSong(createAudioResource(s.stream, {
                    inputType: s.type,
                }));
            }
            else {
                this.playingAll = false;
                this.playerMusic?.removeListener(AudioPlayerStatus.Idle, p);
            }
        };

        await p();
        this.playerMusic?.on(AudioPlayerStatus.Idle, async () => {
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
        if (yt_validate(request) == "playlist") {
            const pl = await playlist_info(request);
            await pl.fetch();
            for (let i = 1; i <= pl.total_pages; i++) {
                pl.page(i).forEach((s) => {
                    this.queue.push({
                        streamUrl: s.url,
                        thumbnailUrl: s.thumbnails[0].url,
                        title: s.title as string,
                        channel: (s.channel as YouTubeChannel).name as string,
                        duration: s.durationRaw,
                    });
                });
            }

            return true;
        }
        if (yt_validate(request) == "video") {
            const vid = (await video_basic_info(request)).video_details;
            this.queue.push({
                streamUrl: vid.url,
                thumbnailUrl: vid.thumbnails[0].url,
                title: vid.title as string,
                channel: (vid.channel as YouTubeChannel).name as string,
                duration: vid.durationRaw,
            });
            return true;
        }
        return false;
    }
}

export interface nagVideo {
    streamUrl: string;
    thumbnailUrl: string;
    title: string;
    channel: string;
    duration : string;
}