import fs from "fs"
import { REST } from "@discordjs/rest"
import { Routes } from "discord-api-types/v9"
import { clientId, guildId, token } from "../config.json"
import { nagLogger } from "./modules/nagLogger";

const commands: Array<unknown> = [];
const rest = new REST({ version: '9' }).setToken(token);
const commandFiles = fs.readdirSync(__dirname + "/commands")

/** 
 * Deploy commands to a local testing guild
 * @return void
*/
export const deployLocal = () => {
    //nagLogger.getInstance().log("info", 
    //        "Deploying local commands to test server");
    console.log("Deploying local commands to test server")
    commandFiles.forEach(async file => {
        const command = require(`./commands/${file}`);
        commands.push(command.data.toJSON());
        try {
            await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: commands }
            )
        }
        catch (error) {
            console.error(error);
        }
    })
}

deployLocal();

//TODO: Make global commands
export const deployGlobal = () => {

}
