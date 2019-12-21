import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LogEntry, LogLevel } from './log.entry.entity';
import { Repository } from 'typeorm';
import { WsGateway } from '../../ws/ws.gateway';
import { UserLevel } from '../constants';

@Injectable()
export class LogService {
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
    public async log(entrance, level: LogLevel, message: string, exception: any = null) {
        const trace = new Error().stack;
        const parsed = this.parseStack(trace, entrance);
        return await this.logEntry(parsed.logger, level, message, parsed.trace, exception);
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

    private parseStack(stack, entrance: string) {
        const result: any = {};
        stack = stack.replace('Error: \n', '');
        const traces = stack.split('\n').map(x => {
            const a = x.replace('    at ', '').split(' (');
            return {
                logger: a[0].trim(),
                path: a[1] && a[1].replace(')', ''),
            };
        });
        const index = traces.reverse().findIndex(a => a.logger.indexOf(`${this.constructor.name}.log`) !== -1);
        traces.reverse().splice(0, traces.length - index);
        const a = traces[0].logger.split('.');
        traces[0].logger = a[0] + '.' + (a[1] === '<anonymous>' ? entrance : a[1]);
        result.logger = traces[0].logger;
        const ignoreLines = ['Generator.next', 'new Promise', 'fulfilled', '__awaiter'];
        result.trace = traces.filter(x => ignoreLines.indexOf(x.logger) === -1).map(x => `${x.logger} (${x.path})`).join('\n');
        return result;
    }
    private async logEntry(logger: string, level: LogLevel, message: string, trace?: string, exception?: any) {
        const logEntry = new LogEntry();
        logEntry.created = Date.now();
        logEntry.level = level,
        logEntry.message = message,
        logEntry.logger = logger;
        logEntry.trace = trace;
        logEntry.exception = JSON.stringify(exception);
        if (this.socket) {
            const event = `logger:${LogLevel[logEntry.level]}`;
            this.socket.sendEvent(event, logEntry, UserLevel.Admin);
        }

        if (level >= this.displayLevel) {
            console.log(JSON.stringify(logEntry));
        }
        await this.logger.save(logEntry);
    }
}