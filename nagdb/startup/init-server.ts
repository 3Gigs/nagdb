import { Server } from "../../Web_Server/server";
import { web_server } from "../../config.json";

module.exports = {
    async execute() {
        if (web_server != "disabled") {
            const server = new Server();
            server.init();
        }
    },
};