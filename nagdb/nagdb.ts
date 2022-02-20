import { Client, Intents } from "discord.js";
import { token } from "../config.json";
import { commandHandler, loadStartup } from "./commandHandler";
import { is_expired, refreshToken, authorization } from "nagdl";
import { readFileSync } from "fs";
import { createInterface } from "readline";

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_VOICE_STATES] });

const cmdHandler = commandHandler.construct(client);

client.once("ready", async () => {
    const startup = new loadStartup();
    await startup.load();
    cmdHandler.attachCommandListener();
});

// Login to Discord with your client's token
client.login(token);
console.log("Sucessfully logged in!");


(async () => {
    try {
        readFileSync(".data/spotify.data");
        if (is_expired()) {
            refreshToken();
        }
    }
    catch (e) {
        const rl = createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question(`Do you want to create a spotify token? (Required for 
            playing spotify) <yes / no>\n`, (p) => {
            if (p === "yes") {
                rl.close();
                authorization();
            }
        });
    }
})();

