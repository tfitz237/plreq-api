import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class LogEntry {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    logger: string;

    @Column()
    message: string;

    @Column()
    created: number;

    @Column()
    level: LogLevel;

    @Column({nullable: true})
    exception: string;

} 


export enum LogLevel {
    TRACE,
    DEBUG,
    INFORMATION,
    WARNING,
    ERROR,
    FATAL
}