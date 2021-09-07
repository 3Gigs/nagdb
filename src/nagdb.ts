import { Client, Intents } from "discord.js";
import { token } from "../config.json";
import { commandHandler } from "./commandHandler";
import { nagLogger } from "./modules/nagLogger";

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_VOICE_STATES] });

nagLogger.getInstance().logBot(client);
const cmdHandler = commandHandler.construct(client);

client.once("ready", () => {
    cmdHandler.attachCommandListener();
});

// Login to Discord with your client's token
client.login(token);

