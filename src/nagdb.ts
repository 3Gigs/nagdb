import { Client, Intents } from "discord.js";
import {token} from "../config.json"
import { commandHandler } from "./commandHandler"
import { nagLogger } from "./modules/nagLogger"

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS, 
            Intents.FLAGS.GUILD_VOICE_STATES] });
const cmdHandler = new commandHandler(client);

client.once('ready', () => {
	console.log('Ready!');
    cmdHandler.attachCommandListener();
});

// Login to Discord with your client's token
client.login(token);
