import { Server } from "../modules/Web_Server/server";

module.exports = {
    async execute() {
        const server = new Server();
        server.init();
    },
};