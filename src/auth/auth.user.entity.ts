import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { UserLevel } from '../shared/constants';
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
}
