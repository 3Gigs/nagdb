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
        this.app.get("/api/music/:arg", (req, res) => {
            const serverId = req.header("discordServerId");
            if (!serverId) {
                res.send(`Bot is not connected to any Voice Chat in this 
                    server!`);
                res.statusCode = 404;
                return;
            }
            const arg = req.params.arg;
            const instance = nagPlayer.getInstance(serverId);

            switch (arg) {
            case "nowplaying":
                break;
            }
        });
    }
}