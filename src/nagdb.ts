import { Client, Intents } from "discord.js";
import { token } from "../config.json";
import { commandHandler } from "./commandHandler";
import { is_expired, refreshToken } from "nagdl"

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_VOICE_STATES] });

const cmdHandler = commandHandler.construct(client);

client.once("ready", () => {
    cmdHandler.attachCommandListener();
});

// Login to Discord with your client's token
client.login(token);

(async () => {
    if(is_expired()) {
	await refreshToken(); 
    }
})();

console.log("Sucessfully logged in!");

