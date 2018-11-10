import { Injectable } from '@nestjs/common';
import axios from 'axios';
import Configuration from '../shared/configuration';
import { tmdbEpisode } from '../models/tmdb';

@Injectable()
export class TmdbService {

    constructor(private readonly config: Configuration) {

    }
    async getSeason(name: string, season: number, id?: string): Promise<{showId: string, episodes:tmdbEpisode[]}> {
        if (!id) {
            id = await this.getShowId(name);
        }
        if (id) {
            const seasonResults = await axios.get(`https://api.themoviedb.org/3/tv/${id}/season/${season}?api_key=${this.config.tmdb.apiKey}`);
            return {showId: id, episodes: seasonResults.data.episodes};
        }
        return null;

    }

    async getShowId(name: string) {
        const result = await axios.get(`https://api.themoviedb.org/3/search/tv?api_key=${this.config.tmdb.apiKey}&query=${name}`);
        return result.data.results && result.data.results.length > 0 ? result.data.results[0].id : false;
    }

    async getSeasonList(name: string, season: number, id?: string): Promise<number[]>{
        const results = await this.getSeason(name, season, id);
        return results.episodes.map(e => e.episode_number);
    }

}
