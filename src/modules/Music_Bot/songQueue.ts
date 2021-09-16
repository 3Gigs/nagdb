import { dlog } from "../nagLogger";
import { nagVideo } from "./linkParser";

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
    private queue: Array<nagVideo>;

    public constructor() {
        this.queue = [];
    }

    /**
     * Enqueue Video to queue
     *
     * @returns Position in queue
     */
    @dlog("debug", "Adding song to queue")
    enqueue(music: nagVideo): number | undefined {
        const result = this.queue.push(music);
        return result ? result : undefined;
    }
    /**
     * Dequeue a AudioResource from queue
     *
     * @returns Next Djs/Voice AudioResource to play
     */
    @dlog("debug", "Dequeuing...")
    dequeue(): nagVideo | undefined {
        const result = this.queue.shift();
        return result ? result : undefined;
    }

    /**
     * Clears song queue
     *
     * @memberof songQueue
     */
    @dlog("debug", "Clearing queue")
    clear(): void {
        this.queue = [];
    }
}
