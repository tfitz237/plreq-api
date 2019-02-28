import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { TvEpisode } from "./suscription.episode.entity";

@Entity()
export class TvSubscription {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    created: number;

    @Column()
    name: string;

    @Column()
    season: number;

    @OneToMany(type => TvEpisode, tvEp => tvEp.subscription, {cascade: true}) 
    episodes: TvEpisode[];

    get episodesInPlex() {
        return this.episodes.filter(x => x.inPlex);
    }

    get episodesNotInPlex() {
        return this.episodes.filter(x => !x.inPlex);
    }

    get episodeNumbers() {
        return this.episodes.map(x => x.episode);
    }
    get numberOfEpisodes() {
        return this.episodes.length;
    }

    @Column()
    tmdbId: number;

}