import { Client, Collection } from "discord.js"
import path from "path"
import fs from "fs";

interface clientCommands extends Client{
    commands?: Collection<string, unknown>
}

export class commandHandler {
    client: clientCommands;
    commandFiles: Array<string>;
    constructor(client: Client) {
        this.client = client;
        this.commandFiles = fs.readdirSync(__dirname + "/../commands")
        this._makeCommandCollection();
        this.addCommands();
    }

    _makeCommandCollection() {
        this.client.commands = new Collection()
    }
    
    addCommands() {
        this.commandFiles.forEach(file => {
            const command = require(`../commands/${file}`);
            this.client.commands?.set(command.data.name, command)
        })
    }
}

