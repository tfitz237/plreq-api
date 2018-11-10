import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

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

    @Column()
    private hasEpisodes: string;

    get HasEpisodes(): number[] { return JSON.parse(this.hasEpisodes); }
    set HasEpisodes(val) { this.hasEpisodes = JSON.stringify(val) }

    @Column()
    tmdbId: string;

    @Column()
    numberOfEpisodes: number;
}