export interface LogQuery {
    level: LogLevel;
    page?: number;
    pageSize?: number;
    logger?: string;
    entrance?: string;
    singleLevel?: boolean;
    order?: 'ASC' | 'DESC' | 1 | -1;
}

export enum LogLevel {
    TRACE,
    DEBUG,
    INFORMATION,
    WARNING,
    ERROR,
    FATAL,
}