import express from "express";
import { port, name } from "../config.json";
import { nagPlayer } from "../nagdb/modules/Music_Bot/nagPlayer";


export class Server {
    private app
    private port;

    constructor() {
        this.app = express();
        this.port = port;
    }

    init(): void {
        this.app.listen(this.port, () => {
            console.log(`Server started at localhost:${this.port}`);
        });

        this.app.get("/api", (req, res) => {
            res.send(`<h1>nagdb on ${name}</h1>`);
        });

        this.app.get("/api/about", (req, res) => {
            const about = {
                name,
            };

            res.json(about);
        });
        this.app.get("/api/music/:arg/:opt1?/:opt2?", (req, res) => {
            const serverId = req.header("discordServerId");
            if (!serverId) {
                res.send("You must specify a discordServerId header!");
                res.statusCode = 404;
                return;
            }
            const arg = req.params.arg.toLowerCase();
            const opt1 = req.params.opt1?.toLowerCase()
                ? parseInt(req.params.opt1.toLowerCase()) : undefined;
            const opt2 = req.params.opt2?.toLowerCase()
                ? parseInt(req.params.opt2.toLowerCase()) : undefined;
            const instance = nagPlayer.getInstance(serverId);

            if (!instance) {
                res.send(`nagdb is not connected to any voice channel in 
                    specified server!`);
                res.statusCode = 404;
                return;
            }

            switch (arg) {
            case "nowplaying":
                res.send(instance.nowPlaying);
                break;
            case "queue":
                if (opt1) {
                    const pageSize = opt2 ? opt2 : 10;
                    const q = instance.getQueuePaginated(opt1, pageSize);
                    if (q) {
                        res.json(instance.getQueuePaginated(opt1, pageSize));
                    }
                    else {
                        res.send("Page number invalid!");
                        res.statusCode = 404;
                    }
                    break;
                }
                res.json(instance.queue);
                break;
            }
        });
    }
}