/**@module commandHandler */
import { Client, Collection } from "discord.js"
import path from "path"
import fs from "fs";

/**Discord.js' Client but with commands collection added */
export interface clientCommands extends Client {
    /**
     * A collection of commands
     * 
     * @type {Collection<string, unknown>}
     * @memberof clientCommands
     */
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
        this.commandFiles = fs.readdirSync(__dirname + "/commands")
        this.commandFiles.forEach(file => {
            const command = require(`./commands/${file}`);
            this.client.commands?.set(command.data.name, command)
        })
        console.log("Command files refreshed!");
    }

    /**
     * Attaches the interaction handler to the listener
     * 
     * @return void
     * @memberof commandHandler
     */
    attachCommandListener() {
        this.client.on("interactionCreate", async interaction => {
            console.log("Interaction received!");
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

