import { Injectable } from '@nestjs/common';
import axios from 'axios';
import Configuration from '../shared/configuration';
import { tmdbEpisode } from '../models/tmdb';

@Injectable()
export class TmdbService {
    private genres: any;

    constructor(private readonly config: Configuration) {

    }     
    async getSeason(name: string, season: number, id?: number): Promise<{showId: number, episodes:tmdbEpisode[]}> {
        if (!id) {
            id = await this.getShowId(name);
        }
        if (id) {
            const seasonResults = await axios.get(`https://api.themoviedb.org/3/tv/${id}/season/${season}?api_key=${this.config.tmdb.apiKey}`);
            return {showId: id, episodes: seasonResults.data.episodes};
        }
        return null;
    }

    async searchForShow(name: string) {
        const result = await axios.get(`https://api.themoviedb.org/3/search/tv?api_key=${this.config.tmdb.apiKey}&query=${name}`);
        return await this.mapTvSearchResults(result.data.results);
    }

    async getShowSeasons(id: number) {
        const result = await axios.get(`https://api.themoviedb.org/3/tv/${id}?api_key=${this.config.tmdb.apiKey}`);
        return this.mapSeasonSearchResults(result.data);
    }

    async mapSeasonSearchResults(results) {
        return results.seasons.map(x => ({
                airDate: x.air_date,
                airYear: x.air_date ? x.air_date.split('-')[0] : null,
                name: x.name,
                seasonNumber: x.season_number,
                numberOfEpisodes: x.episode_count
            })).filter(x => x.seasonNumber > 0);
    }

    async mapTvSearchResults(results): Promise<TvResult[]> {
        const genres = await this.getGenres();
        const rtn = results.map(x => {
            return {
                id: x.id,
                name: x.name,
                voteAverage: x.vote_average,
                posterPath: 'http://image.tmdb.org/t/p/w500' + x.poster_path,
                firstAirDate: x.first_air_date,
                firstYear: x.first_air_date.split('-')[0],
                description: x.overview,
                genres: this.mapGenres(x.genre_ids, genres[MediaType.TV])
            }
        });
        return rtn;
    }

    async getGenres() {
        if (this.genres && 
            this.genres.tv && this.genres.tv.length > 0 && 
            this.genres.movie && this.genres.movie.length > 0) {
            return this.genres;
        }

        const movieResults = await axios.get(`https://api.themoviedb.org/3/genre/movie/list?api_key=${this.config.tmdb.apiKey}`);
        const tvResults = await axios.get(`https://api.themoviedb.org/3/genre/tv/list?api_key=${this.config.tmdb.apiKey}`);
        this.genres = [];
        this.genres[MediaType.TV]  = tvResults.data.genres;
        this.genres[MediaType.MOVIE] = movieResults.data.genres;

        return this.genres;
    }

    mapGenres(genreIds: number[], genres: any[]) {
        return genres.filter(x => genreIds.indexOf(x.id) > -1).map(x => x.name);
    }

    async getShowId(name: string): Promise<number> {
        const result = await this.searchForShow(name);
        return result && result.length > 0 ? result[0].id : -1;
    }

    async getSeasonList(name: string, season: number, id?: number): Promise<number[]>{
        const results = await this.getSeason(name, season, id);
        return results.episodes.map(e => e.episode_number);
    }

}

enum MediaType {
    TV,
    MOVIE
}


export interface TvResult {
    id: number;
    name: string;
    voteAverage: number;
    posterPath: string;
    firstAirDate: string;
    firstYear: string;
    description: string;
    genres: string[];
}