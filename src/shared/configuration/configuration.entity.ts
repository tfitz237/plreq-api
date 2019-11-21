import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { User } from '../../auth/auth.user.entity';


@Entity()
export class Configuration {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    key: string;

    @Column()
    value: string;

    @CreateDateColumn()
    created: Date;

    @UpdateDateColumn()
    updated: Date;

    @ManyToMany(type => User)
    user: User;

} 
