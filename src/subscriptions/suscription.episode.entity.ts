import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { TvSubscription } from './tv-subscription.entity';

@Entity()
export class TvEpisode {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(type => TvSubscription, tvsub => tvsub.episodes, {onDelete: 'CASCADE'})
    subscription: TvSubscription;

    @Column()
    episode: number;

    @Column()
    name: string;

    @Column()
    season: number;

    @Column()
    airDate: string;

    @Column()
    inPlex: boolean;

    @Column()
    itiStatus: ItiLinkStatus;
}

export enum ItiLinkStatus {
    DOWNLOADED,
    UNKNOWN,
    FOUND,
    NOTFOUND,
    ERROR,
}