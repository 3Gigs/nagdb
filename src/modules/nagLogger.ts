/**@module nagLogger */
import { Client } from "discord.js";
import winston, { loggers } from "winston"

/**
 * Not another generic Logger! 
 *
 * @export
 * @class nagLogger
 */
export class nagLogger {
    private static instance: nagLogger;
    private static logger : winston.Logger;

    /** @private */
    private constructor() {}

    /**
     * Get single winston logger instance
     *
     * @return {*} The winston Logger instasnce
     * @memberof nagLogger
     */
    public static getInstance(): nagLogger {
        if(!nagLogger.instance) {
            nagLogger.instance = new this();
        }
        if(!nagLogger.logger) {
            nagLogger.logger = winston.createLogger({
                transports: [
                    new winston.transports.Console(),
                    new winston.transports.File({ filename: 'nagdb' }),
                ],
                format: winston.format.printf(log => 
                    `[${log.level.toUpperCase()}] - ${log.message}`)
            })
        }
        return nagLogger.instance;
    }

    /**
     * Enables Discord bot logging
     *
     * @param {Client} client
     * @memberof nagLogger
     */
    logBot(client: Client) {
        client.on("ready", () => {
            nagLogger.logger.log("info", "Bot online!");
        })
        client.on("debug", m => {
            nagLogger.logger.log("debug", m);
        })
        client.on("warn", m => {
            nagLogger.logger.log("warn", m);
        })
        client.on("error", m => {
            nagLogger.logger.log("error", m);
        })
        process.on("uncaughtException", m => {
            nagLogger.logger.log("error", m)
        })
    }

    /**
     * Decorator factory, allows for using this logger via decorator
     *
     * @param {string} m
     * @return {*}  {MethodDecorator}
     * @memberof nagLogger
     */
    log(logLevel: string, m : string): MethodDecorator {
        return function(target: Object, 
                key: string | symbol, 
                descriptor: PropertyDescriptor) : void {
                    nagLogger.logger.log(logLevel, (key.toString() + m));
                }
    }

}