// Require the necessary discord.js classes
import { Client, Intents } from "discord.js";
import {token} from "../config.json"
import { commandHandler } from "./commandHandler";

// Create a new client instance
const client: Client = new Client({ intents: [Intents.FLAGS.GUILDS] });
const commandhandler: commandHandler = new commandHandler(client);

// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log('Ready!');
});

client.on("interactionCreate", async interaction => {
    if(!interaction.isCommand()) return;

    const command: any = commandhandler
            .client
            .commands?.get(interaction.commandName);

    if(!command) return;

    try {
        await command.execute(interaction)
    } catch(error) {
        console.error(error);
        await interaction.reply(
                { content: 'There was an error while executing this command!', 
                ephemeral: true }
        );
    }
})

// Login to Discord with your client's token
client.login(token);