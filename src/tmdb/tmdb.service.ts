import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { TmdbEpisode } from '../models/tmdb';
import ConfigurationService from '../shared/configuration/configuration.service';

@Injectable()
export class TmdbService {
    private genres: any;
    private hostPrefix: string = 'https://api.themoviedb.org/3';
    constructor(private readonly configService: ConfigurationService) {
    }

    async config() {
        return await this.configService.getConfig();
    }
    async getSeason(name: string, season: number, id?: number): Promise<{showId: number, episodes: TmdbEpisode[]}> {
        const config = await this.config();
        if (!id) {
            id = await this.getShowId(name);
        }
        if (id) {
            const seasonResults = await axios.get(`${this.hostPrefix}/tv/${id}/season/${season}?api_key=${config.tmdb.apiKey}`);
            return {showId: id, episodes: seasonResults.data.episodes};
        }
        return null;
    }

    async searchForShow(name: string) {
        const config = await this.config();
        const result = await axios.get(`${this.hostPrefix}/search/tv?api_key=${config.tmdb.apiKey}&query=${name}`);
        return await this.mapTvSearchResults(result.data.results);
    }

    async searchForMovie(name: string, single?: boolean) {
        const config = await this.config();
        const result = await axios.get(`${this.hostPrefix}/search/movie?api_key=${config.tmdb.apiKey}&query=${name}`);
        if (single) {
            const singleResult = await this.getMovie(result.data.results[0].id);
            return singleResult;
        }
        return await this.mapMovieSearchResults(result.data.results);
    }

    async getMovie(id: number) {
        const config = await this.config();
        const result = await axios.get(`${this.hostPrefix}/movie/${id}?api_key=${config.tmdb.apiKey}`);
        return result.data;
    }

    async getShowSeasons(id: number) {
        const config = await this.config();
        const result = await axios.get(`${this.hostPrefix}/tv/${id}?api_key=${config.tmdb.apiKey}`);
        return this.mapSeasonSearchResults(result.data);
    }

    async mapMovieSearchResults(results, single: boolean = false) {
        const genres = await this.getGenres();
        return results.map(x => {
            return {
                id: x.id,
                name: x.title,
                imdbId: x.imdb_id,
                description: x.overview,
                firstYear: x.release_date,
                posterPath: 'http://image.tmdb.org/t/p/w500' + x.poster_path,
                genres: single ? x.genres : this.mapGenres(x.genre_ids, genres[MediaType.MOVIE]),
                voteAverage: x.vote_average,
            };
        });
    }

    async mapSeasonSearchResults(results) {
        return results.seasons.map(x => ({
                airDate: x.air_date,
                airYear: x.air_date ? x.air_date.split('-')[0] : null,
                name: x.name,
                seasonNumber: x.season_number,
                numberOfEpisodes: x.episode_count,
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
                genres: this.mapGenres(x.genre_ids, genres[MediaType.TV]),
            };
        });
        return rtn;
    }

    async getGenres() {
        if (this.genres &&
            this.genres.tv && this.genres.tv.length > 0 &&
            this.genres.movie && this.genres.movie.length > 0) {
            return this.genres;
        }
        const config = await this.config();
        const movieResults = await axios.get(`${this.hostPrefix}/genre/movie/list?api_key=${config.tmdb.apiKey}`);
        const tvResults = await axios.get(`${this.hostPrefix}/genre/tv/list?api_key=${config.tmdb.apiKey}`);
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
    MOVIE,
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