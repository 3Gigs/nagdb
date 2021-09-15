import { validate_playlist,
    playlist_info,
    validate,
    video_info } from "play-dl";
import { PlayList } from "play-dl/dist/YouTube/classes/Playlist";
import { Video } from "play-dl/dist/YouTube/classes/Video";
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

/**
 * **Simple songQueue implementation**
 *
 * @export
 * @note Don't directly use this for music bots! Use nagPlayer class instead!
 * @class songQueue
 */
export class songQueue {
    private queue: Array<Video>;

    public constructor() {
        this.queue = [];
    }

    @dlog("debug", "Adding song to queue")
    enqueue(music: Video): number | undefined {
        const result = this.queue.push(music);
        return result ? result : undefined;
    }
    /**
     * Dequeue a AudioResource from queue
     *
     * @returns Next Djs/Voice AudioResource to play
     */
    @dlog("debug", "Dequeuing...")
    dequeue(): Video | undefined {
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
export async function parsePlaylist(input: string):
    Promise<Video[] | undefined> {
    // If single youtube-video detected
    if (validate_playlist(input)) {
        const vidList: Array<Video> = [];
        let playlist: PlayList | undefined;

        try {
            playlist = await playlist_info(input);
            if (playlist) {
                const playlistAll = await playlist.fetch();
                if (playlistAll) {
                    const videosAll = await playlistAll.fetch();
                    // TODO: Support for multiple pages
                    const videosPaged = videosAll.page(1);
                    // Push every song in every page to songList
                    for (const video of videosPaged) {
                        await (async () => {
                            vidList.push(video);
                        })();
                    }
                }
                return vidList;
            }
        }
        catch (error) {
            console.log(error);
            throw new Error("Error while parsing playlist!");
        }
    }
    else if (validate(input)) {
        const vidList: Array<Video> = [];
        const vid_info: video_details = (await video_info(input)).video_details;
        const video = new Video(
            {
                id: vid_info.id,
                title: vid_info.title,
                description: vid_info.description,
                duration_raw: vid_info.durationRaw,
                duration: vid_info.durationRaw,
                uploadedAt: vid_info.uploadedDate,
                views: vid_info.views,
                thumbnail: vid_info.thumbnail,
                channel: vid_info.channel,
                likes: !!vid_info.live,
                private: !!vid_info.private,
                tags: vid_info.tags,
            });

        vidList.push(video);
        return vidList;
    }
    else {
        throw new Error("Not a valid playlist!");
    }
}