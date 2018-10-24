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

    get HasEpisodes() { return JSON.parse(this.hasEpisodes); }

    @Column()
    numberOfEpisodes: number;
}