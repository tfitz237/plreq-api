import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LogEntry, LogLevel } from './log.entry.entity';
import { Repository } from 'typeorm';
import { WsGateway } from '../../ws/ws.gateway';
import { UserLevel } from '../constants';

@Injectable()
export class Logger {
    type: any;
    socket: WsGateway;
    displayLevel: LogLevel = LogLevel.DEBUG;
    constructor(
        @InjectRepository(LogEntry)
        private readonly logger: Repository<LogEntry>,
    ) {}

    public setSocket(gateway: WsGateway) {
        this.socket = gateway;
    }
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
        if (this.socket) {
            this.socket.sendEvent(`logger:${LogLevel[logEntry.level]}`, logEntry, UserLevel.Admin);
        }

        if (level >= this.displayLevel) {
            console.log(JSON.stringify(logEntry));
        }
        await this.logger.save(logEntry);
    }
}