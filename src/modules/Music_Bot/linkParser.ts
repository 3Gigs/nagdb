import { playlist_info,
    validate,
    validate_playlist,
    video_info } from "play-dl";
import { video_details } from "./songQueue";

export interface nagVideo {
    url: string,
    duration: string,
    thumbnailURL?: string;
    album?: string;
    title?: string;
    author?: string;
}

export class nagLinkParser {
    private static parseYTLink = async (input: string):
    Promise<nagVideo[] | undefined> => {
        if (validate_playlist(input)) {
            const nagVideoList: Array<nagVideo> = [];

            try {
                const playlist = await playlist_info(input);

                if (playlist) {
                    const playlistAll = await playlist.fetch();

                    if (playlistAll) {
                        for (let i = 1; i <= playlistAll.total_pages; i++) {
                            for (const video of playlistAll.page(i)) {
                                await (async () => {
                                    nagVideoList.push({
                                        url: video.url as string,
                                        duration: video.durationRaw,
                                        title: video.title,
                                        author: video.channel?.name,
                                        thumbnailURL: video.thumbnail?.url });
                                })();
                            }
                        }
                    }

                    return nagVideoList;
                }
            }
            catch (error) {
                return undefined;
            }
        }
        else if (validate(input)) {
            const nagVideoList: Array<nagVideo> = [];
            const vid_info: video_details = (await video_info(input))
                .video_details;

            nagVideoList.push({
                url: vid_info.url as string,
                duration: vid_info.durationRaw,
                title: vid_info.title,
                author: vid_info.channel?.name,
                thumbnailURL: vid_info.thumbnail?.url });

            return nagVideoList;
        }
    };

    public static parseInputLink = async (input: string):
    Promise<nagVideo[] | undefined> => {
        let vidList: Array<nagVideo> | undefined = undefined;

        if (validate(input)) {
            const result = await nagLinkParser.parseYTLink(input);
            if (result) {
                vidList = Array.from(result);
            }
            return vidList;
        }

        return undefined;
    }
}

