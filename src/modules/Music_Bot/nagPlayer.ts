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
import { stream, video_basic_info } from "play-dl";
import { VoiceChannel } from "discord.js";
import fifo from "fifo";

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
    private queue : fifo<any>;

    /**
     * Creates an instance of nagPlayer with a specified VoiceChannel
     * @param {VoiceChannel} vc
     * @memberof nagPlayer
     */
    public constructor(vc : VoiceChannel) {
        this.connection = this.joinChannel(vc)?.connection;
        this.queue = fifo();
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
        this.playerMusic.play(resource);
    }

    /**
     * Plays all music from queue, with optional callback function for
     * displaying current song playing
     *
     * @return {*}  {Promise<void>}
     * @memberof nagPlayer
     */
    public async playAll(func? : (song: any) => void) : Promise<void> {
        if (this.playingAll) {
            return;
        }
        const p = async () => {
            const song = this.queue.shift()?.value.video_details;
            if (song) {
                if (func) {
                    func(song);
                }
                const s = await stream(song.url);
                this.playSong(createAudioResource(s.stream, {
                    inputType: StreamType.Arbitrary,
                }));
            }
            else {
                this.playingAll = false;
                this.playerMusic?.removeListener(AudioPlayerStatus.Idle, p);
            }
        };

        this.playerMusic?.on(AudioPlayerStatus.Idle, async () => {
            p();
        });
    }

    /**
     * Accepts a request string (search query or link) and adds song(s) to queue
     *
     * @param {string} request
     * @return {*}  {Promise<boolean>}
     * @memberof nagPlayer
     */
    async addSongs(request : string): Promise<void> {
        this.queue.push((await video_basic_info(request)).video_details);
    }
}
