import { Logger } from './log.service';
import { LogLevel } from './log.entry.entity';

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

    logError(entrance, message, exception = null) {
        this.log(entrance, LogLevel.INFORMATION, message, exception);
    }

    logFatal(entrance, message, exception = null) {
        this.log(entrance, LogLevel.FATAL, message, exception);
    }
}