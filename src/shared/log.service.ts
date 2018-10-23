import { Injectable, Optional } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { LogEntry, LogLevel } from "./log.entry.entity";
import { Repository } from "typeorm";


@Injectable()
export class Logger {
    type: any;
    constructor(
        @InjectRepository(LogEntry)
        private readonly logger: Repository<LogEntry>,
    ) {
    }


    private async logEntry(logger: string, entrance: string, level: LogLevel, message: string, exception: string = null) {
        

        const logEntry = new LogEntry();
        logEntry.created = Date.now();
        logEntry.level = level,
        logEntry.message = message,
        logEntry.exception = exception;
        logEntry.logger = `${logger}.${entrance}()`;
        await this.logger.save(logEntry)
    }

    public async log(logger: string, entrance: any, level: LogLevel, message: string, exception: string = null) {
        return await this.logEntry(logger, entrance,level,message,exception);
    }

}


export class LogMe {
    private logger: Logger;
    constructor(logService: Logger){
        this.logger = logService;
    }

    log(entrance: any, level: LogLevel, message: string, exception: string = null) {
        this.logger.log(this.constructor.name, entrance.name, level, message, exception);
    }

    logInfo(entrance, message) {
        this.log(entrance, LogLevel.INFORMATION, message);
    }

    logTrace(entrance, message) {
        this.log(entrance, LogLevel.TRACE, message);
    }

    logDebug(entrance, message) {
        this.log(entrance, LogLevel.DEBUG, message);
    }

    logWarning(entrance, message) {
        this.log(entrance, LogLevel.WARNING, message);
    }

    logError(entrance, message, exception) {
        this.log(entrance, LogLevel.INFORMATION, message, exception);
    }

    logFatal(entrance, message, exception) {
        this.log(entrance, LogLevel.FATAL, message, exception);
    }
}