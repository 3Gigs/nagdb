import express from "express";
import { port } from "../../../config.json";
import path from "path";

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

        this.app.get("/", (req, res) => {
            console.log(`${path.join(__dirname, "routes", "get", "index")}`);
            res.sendFile(path
                .resolve("./www/src/html/index.html"));
        });

        this.app.get("/output.css", (req, res) => {
            res.sendFile(path.resolve("./www/dist/output.css"));
        });
    }
}