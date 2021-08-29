import { Client, Intents } from "discord.js";
import {token} from "../config.json"
import { deployLocal } from "./deploy-commands"
import { commandHandler } from "./commandHandler"

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
const cmdHandler = new commandHandler(client);

deployLocal();

client.once('ready', () => {
	console.log('Ready!');
    cmdHandler.attachCommandListener();
});

// Login to Discord with your client's token
client.login(token);