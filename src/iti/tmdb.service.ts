import { Injectable } from '@nestjs/common';
import axios from 'axios';
import Configuration from '../shared/configuration';
import { tmdbEpisode } from '../models/tmdb';

@Injectable()
export class TmdbService {

    constructor(private readonly config: Configuration) {

    }
    async getSeason(name: string, season: number): Promise<tmdbEpisode[]> {
        const result = await axios.get(`https://api.themoviedb.org/3/search/tv?api_key=${this.config.tmdb.apiKey}&query=${name}`);
        const id = result.data.results && result.data.results.length > 0 ? result.data.results[0].id : false;
        if (id) {
            const seasonResults = await axios.get(`https://api.themoviedb.org/3/tv/57243/season/${season}?api_key=${this.config.tmdb.apiKey}`);
            return seasonResults.data.episodes;
        }
        return null;

    }

    async getSeasonList(name: string, season: number): Promise<number[]>{
        const results = await this.getSeason(name, season);
        return results.map(e => e.episode_number);
    }

}
