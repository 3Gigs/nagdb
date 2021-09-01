import fs from "fs"
import { REST } from "@discordjs/rest"
import { Routes } from "discord-api-types/v9"
import { clientId, guildId, token } from "../config.json"

const commands: Array<unknown> = [];
const rest = new REST({ version: '9' }).setToken(token);
const commandFiles = fs.readdirSync(__dirname + "/../commands")

// TODO: Add command options
/** 
 * Deploy commands to a local testing guild
 * @return void
*/
export const deployLocal = () => {
    console.log("Deploying local commands to test server");
    commandFiles.forEach(file => {
        const command = require(`./commands/${file}`);
        commands.push(command.data.toJSON());

        (async () => {
            try {
                await rest.put(
                    Routes.applicationGuildCommands(clientId, guildId),
                    { body: commands }
                )
            }
            catch (error) {
                console.error(error);
            }
        })();
    })
}

//TODO: Make global commands
export const deployGlobal = () => {

}
