import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { LogLevel } from '../../models';

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
    trace: string;

    @Column({nullable: true})
    exception: string;

}
