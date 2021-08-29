import fs from "fs"
import path from "path"
import { REST } from "@discordjs/rest"
import { Routes } from "discord-api-types/v9"
import { clientId, guildId, token } from "../config.json"

const commands: unknown = [];
const rest = new REST({ version: '9' }).setToken(token);
const commandFiles = fs.readdirSync(__dirname + "../commands")

commandFiles.forEach(file => {
    const command = require(`../commands/${file}`);
    command.push(command.data.toJSON());
})