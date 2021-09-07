/** @module commandHandler */
import { Client, Collection } from "discord.js";
import fs from "fs";
import { nagLogger } from "./modules/nagLogger";

/** Discord.js' Client but with commands collection added */
export interface clientCommands extends Client {
    /**
     * A collection of commands
     *
     * @type {Collection<string, unknown>}
     * @memberof clientCommands
     */
    commands?: Collection<string, unknown>
}

/**
 * **Handles listening and executing interaction stuff**
 *  Singleton instance
 *
 * @singleton
 * @export
 * @class commandHandler
 */
export class commandHandler {
    private client: clientCommands;
    private commandFiles: Array<string> = [];
    private static _instance: commandHandler;

    /**
     * @private
     * @param {Client} client
     * @memberof commandHandler
     */
    private constructor(client: Client) {
        this.client = client;
        this.refreshCommandDir();
    }

    /**
     * Construct a new commandHandler and store inside a static instance var
     *
     * @static
     * @param {Client} client
     * @return {commandHandler} Singleton instance
     * @throws Error if already instanced
     * @memberof commandHandler
     */
    static construct(client: Client): commandHandler {
        if (!this._instance) {
            return this._instance = new this(client);
        }
        else {
            throw new Error("Singleton already instanced");
        }
    }

    /**
     * Get singleton instance
     *
     * @static
     * @return {*}  {commandHandler}
     * @memberof commandHandler
     */
    static getInstance(): commandHandler {
        if (this._instance) {
            return this._instance;
        }
        else {
            throw new Error("You must use the static construct method to " +
                "create a new instance of this first!");
        }
    }

    private requireUncached(module: any) {
        delete require.cache[require.resolve(module)];
        return require(module);
    }

    /**
     * Adds commands to commands Discord.js collection
     *
     * @return void
     * @memberof commandHandler
     */
    refreshCommandDir():void {
        this.client.commands = new Collection();
        this.commandFiles = fs.readdirSync(__dirname + "/commands");
        this.commandFiles.forEach(file => {
            const command = this.requireUncached(`./commands/${file}`);
            (this.client.commands as Collection<string, unknown>)
                .set(command.data.name, command);
        });
        nagLogger.getInstance().log("info", "All commands refreshed");
    }

    /**
     * Attaches the interaction handler to the listener
     *
     * @return void
     * @memberof commandHandler
     */
    attachCommandListener(): void {
        this.client.on("interactionCreate", async interaction => {
            if (!interaction.isCommand()) return;

            const command: any = this
                .client
                .commands?.get(interaction.commandName);

            if (!command) return;

            try {
                await command.execute(interaction);
            }
            catch (error) {
                nagLogger.getInstance().log("warn",
                    "Cannot execute command\n" + error);
            }
        });
    }
}

