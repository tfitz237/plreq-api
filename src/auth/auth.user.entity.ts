import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { UserLevel } from './auth.service';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: string;

    @Column()
    username: string;

    @Column()
    password: string;

    @Column()
    userGuid: string;

    @Column()
    level: UserLevel;

    @Column()
    emailVerified: boolean;
}
