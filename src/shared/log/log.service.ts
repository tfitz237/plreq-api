import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LogEntry, LogLevel } from './log.entry.entity';
import { Repository } from 'typeorm';

@Injectable()
export class Logger {
    type: any;
    displayLevel: LogLevel = LogLevel.DEBUG;
    constructor(
        @InjectRepository(LogEntry)
        private readonly logger: Repository<LogEntry>,
    ) {}

    public async log(logger: string, entrance: any, level: LogLevel, message: string, exception: string = null) {
        return await this.logEntry(logger, entrance, level, message, exception);
    }

    private async logEntry(logger: string, entrance: string, level: LogLevel, message: string, exception?: string) {
        const logEntry = new LogEntry();
        logEntry.created = Date.now();
        logEntry.level = level,
        logEntry.message = message,
        logEntry.logger = `${logger}.${entrance}()`;
        logEntry.exception = exception;
        if (level >= this.displayLevel) {
            console.log(JSON.stringify(logEntry));
        }
        await this.logger.save(logEntry);
    }
}