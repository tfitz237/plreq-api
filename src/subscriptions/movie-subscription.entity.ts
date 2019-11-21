import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ItiLinkStatus } from './suscription.episode.entity';

@Entity()
export class MovieSubscription {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    created: number;

    @Column()
    name: string;

    @Column()
    airDate: string;

    @Column()
    currentQuality: string;

    @Column({nullable: true})
    highestQuality: string;

    @Column()
    tmdbId: number;

    @Column()
    itiStatus: ItiLinkStatus;

}