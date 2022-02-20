import fs from "fs";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { clientId, guildId, token } from "../config.json";

const commands: Array<unknown> = [];
const rest = new REST({ version: "9" }).setToken(token);
const commandFiles = fs.readdirSync(__dirname + "/commands");

/**
 * Deploy commands to a local testing guild
 * @return void
*/
export const deployLocal = (): Promise<void> =>
    new Promise<void>((resolve, reject) => {
        console.log("Deploying local commands to test server");
        commandFiles.forEach(async file => {
            try {
                const command = require(`./commands/${file}`);
                commands.push(command.data.toJSON());
                rest.put(
                    Routes.applicationGuildCommands(clientId, guildId),
                    { body: commands }
                );
            }
            catch (error) {
                reject(new Error("Cannot deploy file " + file));
            }
        });
        resolve(undefined);
    });

/* TODO:
export const deployGlobal = () => {

};
*/

(async () => {
    await deployLocal();
})();
