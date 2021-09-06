import { Snowflake } from "discord-api-types";
import { nagPlayer } from "./nagPlayer";

/**
 * **Stores nagPlayer instance for every guild**
 */
export const guildPlayers = new Map<Snowflake, nagPlayer>();