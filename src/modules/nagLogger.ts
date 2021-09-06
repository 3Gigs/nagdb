/**@module nagLogger */
import { Client } from "discord.js";
import { createLogger, format, Logger, loggers, transports } from "winston"

/**
 * **Not another generic Logger!**  
 * A very simple single singleton logger
 *
 * @export
 * @class nagLogger
 */
export class nagLogger {
    private static instance: nagLogger;
    logger : Logger;

    /** @private */
    private constructor() {
        this.logger = createLogger({
            level: "info",
            transports: [
                new transports.Console(),
                new transports.File({ filename: 'nagdb.txt', 
                        options: { flags: 'w' } }),
                new transports.File({ filename: 'nagdb-debug.txt', 
                        options: { flags: 'w' },
                        level: "debug" }),
            ],
            format: format.printf(log => 
                `[${log.level.toUpperCase()}] - ${log.message}`)
        })
    }

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
            this.logger.log("info", "Bot online!");
        })
        client.on("debug", m => {
            this.logger.log("debug", m);
        })
        client.on("warn", m => {
            this.logger.log("warn", m);
        })
        client.on("error", m => {
            this.logger.log("error", m);
        })
        process.on("uncaughtException", m => {
            let _stack = undefined;
            if(m.stack) {
                _stack = m.stack;
            }
            this.logger.log("error", m + '\n' + _stack);
        })
    }

    log(warnLvl: string, m: string) {
        this.logger.log(warnLvl, m);
    }
}

/**
 * Decorator factory, allows for using this logger via decorator
 *
 * @param {string} m
 * @return {*}  {MethodDecorator}
 * @memberof nagLogger
 */
export const dlog = function(logLevel: string, m : string): MethodDecorator {
    return function(
        target: Object, 
        key: string | symbol, 
        descriptor: PropertyDescriptor): void {
            const targetMethod = descriptor.value;

            descriptor.value = function(...args: any[]) {
                nagLogger.getInstance().log(logLevel, m);
                return targetMethod.apply(this, args);
            }
        }
}