import { AudioResource, createAudioResource } from "@discordjs/voice";
import { validate,
    video_info,
    stream,
    validate_playlist,
    playlist_info } from "play-dl";
import { PlayList } from "play-dl/dist/YouTube/classes/Playlist";
import { dlog } from "../nagLogger";

/**
 * **See play-dl's video_details**
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

/*
 * @note Used in songQueue to store songs
 * @export
 */
export interface Song {
    resource: AudioResource,
    songDetails: video_details
}

/**
 * **Simple songQueue implementation**
 *
 * @export
 * @note Don't directly use this for music bots! Use nagPlayer class instead!
 * @class songQueue
 */
export class songQueue {
    private queue: Array<Song>;

    public constructor() {
        this.queue = [];
    }

    @dlog("debug", "Adding song to queue")
    enqueue(music: Song): number | undefined {
        const result = this.queue.push(music);
        return result ? result : undefined;
    }
    /**
     * Dequeue a AudioResource from queue
     *
     * @returns Next Djs/Voice AudioResource to play
     */
    @dlog("debug", "Dequeuing...")
    dequeue(): Song | undefined {
        const result = this.queue.shift();
        return result ? result : undefined;
    }
}

/**
 * Create a song or songlist from a youtube-dl supported link
 *
 * @export
 * @param {string} input
 * @return {*}  {(Song | SongList)}
 */
export async function createSongsFromLink(input: string):
    Promise<Song[] | undefined> {
    // If single youtube-video detected
    console.log(validate_playlist(input));
    if (validate_playlist(input)) {
        const songList: Array<Song> = [];
        let playlist: PlayList | undefined;

        try {
            playlist = await playlist_info(input);
            if (playlist) {
                const playlistAll = await playlist.fetch();
                if (playlistAll) {
                    const videosAll = await playlistAll.fetch();
                    const videosPaged = videosAll.page(1);
                    // Push every song in every page to songList
                    for (const video of videosPaged) {
                        if (!video) {
                            throw new Error("Video cannot be found");
                        }
                        await (async () => {
                            const songDetails =
                                await video_info(video.url as string);
                            const songStream =
                                await stream(video.url as string);
                            const resource = createAudioResource(
                                songStream.stream,
                                { inputType: songStream.type }
                            );
                            const song: Song = {
                                resource,
                                songDetails: songDetails.video_details,
                            };
                            console.log(song.songDetails.url);
                            songList.push(song);
                        })();
                    }
                }
                console.log(songList[0]);
                return songList;
            }
        }
        catch (error) {
            console.log(error);
            throw new Error("Error while parsing music link!");
        }
    }
    if (validate(input)) {
        const songList: Array<Song> = [];
        const songDetails: video_details = (await video_info(input))
            .video_details;
        try {
            const musicStream = await stream(input);
            const resource = createAudioResource(musicStream.stream,
                { inputType: musicStream.type });
            const song: Song = {
                resource,
                songDetails,
            };
            songList.push(song);
            return songList;
        }
        catch (error) {
            throw new Error("Error while trying to stream YouTube Link");
        }
    }
}