import { Client, Collection } from "discord.js"
import path from "path"
import fs from "fs";

/**
 * Add a commands collection to Discord.js' Client interface
 *
 * @interface clientCommands
 * @extends {Client}
 * @property {Collection}
 */
interface clientCommands extends Client{
    commands?: Collection<string, unknown>
}

/*
 * Handles listening and executing interaction stuff
 *
 * @export
 * @class commandHandler
 */
export class commandHandler {
    /** @private */
    client: clientCommands;
    /** @private */
    commandFiles: Array<string> = [];

    /**
     * Creates an instance of commandHandler.
     * @param {Client} client
     * @memberof commandHandler
     */
    constructor(client: Client) {
        this.client = client;
        this.client.commands = new Collection();
        this.refreshCommandDir();
    }
    
    /**
     * 
     * @return void
     * @memberof commandHandler
     */
    refreshCommandDir() {
        this.commandFiles = fs.readdirSync(__dirname + "/../commands")
        this.commandFiles.forEach(file => {
            const command = require(`../commands/${file}`);
            this.client.commands?.set(command.data.name, command)
        })
    }

    /**
     * Attaches the interaction handler to the listener
     * 
     * @return void
     * @memberof commandHandler
     */
    attachCommandListener() {
        this.client.on("interactionCreate", async interaction => {
            if(!interaction.isCommand()) return;

            const command: any = this
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
        });
    }
}

