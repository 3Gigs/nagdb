import { playlist_info,
    validate,
    validate_playlist,
    video_basic_info } from "play-dl";
import { Video } from "play-dl/dist/YouTube/classes/Video"


export class nagLinkParser {
    private static parseYTLink = async (input: string):
    Promise<Video[] | undefined> => {
        if (validate_playlist(input)) {
            const nagVideoList: Array<Video> = [];

            try {
                const playlist = await playlist_info(input);

                if (playlist) {
                    const playlistAll = await playlist.fetch();

                    if (playlistAll) {
                        for (let i = 1; i <= playlistAll.total_pages; i++) {
                            for (const video of playlistAll.page(i)) {
                                nagVideoList.push(video);
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
            const nagVideoList: Array<Video> = [];
            const vid_info: any = (await video_basic_info(input))
                .video_details;

            nagVideoList.push({
                url: vid_info.url as string,
                title: vid_info.title,
                author: vid_info.channel.name,
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

