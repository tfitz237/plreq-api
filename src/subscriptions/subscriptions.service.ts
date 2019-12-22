import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CronService } from '../cron/cron.service';
import { ItiService } from '../iti/iti.service';
import { JdService } from '../jd/jd.service';
import { ItiError, ItiLink, ItiLinkResponse } from '../models';
import PlexDb from '../plex/plex.db';
import { LogService } from '../shared/log/log.service';
import { TmdbService } from '../tmdb/tmdb.service';
import { MovieSubscription } from './movie-subscription.entity';
import { ItiLinkStatus, TvEpisode } from './suscription.episode.entity';
import { TvSubscription } from './tv-subscription.entity';

@Injectable()
export class SubscriptionsService{
    tvCronId: number;
    movieCronId: number;
    tvSubscriptions: TvSubscription[] = [];
    movieSubscriptions: MovieSubscription[] = [];

    qualitiesList = [
        'SD',
        '480P',
        '480P DVDRIP',
        '720P',
        '720P BRRIP',
        '720P WEB-DL',
        '720P BDRIP',
        '1080P',
        '1080P BRRIP',
        '1080P WEB-DL',
        '1080P BDRIP',
        '1080P BDRIP HEVC',
    ];

    constructor(
        @InjectRepository(TvSubscription) private readonly tvSubRepo: Repository<TvSubscription>,
        @InjectRepository(MovieSubscription) private readonly movieSubRepo: Repository<MovieSubscription>,
        private readonly logService: LogService,
        private readonly itiService: ItiService,
        private readonly jdService: JdService,
        private readonly tmdbService: TmdbService,
        private readonly plexDb: PlexDb,
        private readonly cronService: CronService,
    ) {
        this.setupPolling();
    }

    async cronJob() {
        this.checkTvSubscriptions().then(() => this.checkMovieSubscriptions());
    }

    async setupPolling() {
        this.tvCronId = this.cronService.setup({
            jobName: 'subs:check-tv',
            description: 'Check Tv Subscriptions, update episode list and attempt to find and download missing episodes',
            interval: '0 0 */2 * * *',
            onTick: {
                service: this,
                methodName: 'cronJob',
                parameters: [],
            },
        });
    }

    async getTvSubscriptions(skipTmdb = true): Promise<TvSubscription[]> {
        const subs = await this.tvSubRepo.find();
        for (const i in subs) {
            if (subs[i]) {
                const sub = subs[i];
                await this.updateEpisodes(sub, true, skipTmdb);
                const idx = this.tvSubscriptions.findIndex(s => s.id === sub.id);
                if (idx !== -1) {
                    Object.assign(this.tvSubscriptions[idx], sub);
                } else {
                    this.tvSubscriptions.push(sub);
                }
            }
        }
        this.tvSubscriptions.forEach((sub, idx) => {
            if (subs.findIndex(x => x.id === sub.id) === -1) {
                this.tvSubscriptions.splice(idx, 1);
            }
        });
        return this.tvSubscriptions;
    }

    async getTvSubscription(id: number) {
        const sub = await this.tvSubRepo.findOne(id);

    }

    async getMovieSubscriptions(): Promise<MovieSubscription[]> {
        const subs = await this.movieSubRepo.find();
        for (const i in subs) {
            if (subs[i]) {
                const sub = subs[i];
                const idx = this.movieSubscriptions.findIndex(s => s.id === sub.id);
                if (idx !== -1) {
                    Object.assign(this.movieSubscriptions[idx], sub);
                } else {
                    this.movieSubscriptions.push(sub);
                }
            }
        }
        this.movieSubscriptions.forEach((sub, idx) => {
            if (subs.findIndex(x => x.id === sub.id) === -1) {
                this.movieSubscriptions.splice(idx, 1);
            }
        });
        return this.movieSubscriptions;
    }

    async updateEpisodes(sub: TvSubscription, save: boolean = true, skipTmdb = false) {
        if (!sub.name) {
            return;
        }
        sub.episodes = sub.episodes && sub.episodes.length >= 0 ? sub.episodes : [];

        const eps = skipTmdb ? { episodes: [] } : await this.tmdbService.getSeason(sub.name, sub.season, sub.tmdbId);
        const allEpisodes = eps.episodes || [];

        const episodes = await this.plexDb.getEpisodeList(sub.name, sub.season);
        if (sub.episodesInPlex && sub.episodesInPlex.length !== episodes.length) {
            episodes.forEach(e => {
                const found = sub.episodes.find(x => x.episode === e);
                if (!found) {
                    const newEp = new TvEpisode();
                    const details = allEpisodes.find(x => x.episode_number === e);
                    newEp.airDate = details ? details.air_date || '01-01-9999' : '01-01-9999';
                    newEp.inPlex = true;
                    newEp.itiStatus = ItiLinkStatus.DOWNLOADED;
                    newEp.episode = e;
                    newEp.season = sub.season;
                    newEp.name = details ? details.name : 'Episode ' + newEp.episode;
                    sub.episodes.push(newEp);
                }
            });
        }
        if (allEpisodes.length !== sub.numberOfEpisodes && !skipTmdb) {
            const missingEpisodes = allEpisodes.filter(x => sub.episodeNumbers.indexOf(x.episode_number) === -1);
            missingEpisodes.forEach(e => {
                const found = sub.episodesNotInPlex.find(ep => ep.episode === e.episode_number &&
                    (ep.itiStatus !== ItiLinkStatus.ERROR && ep.itiStatus !== ItiLinkStatus.NOTFOUND));
                if (!found) {
                    const newEp = new TvEpisode();
                    newEp.airDate = e.air_date || '01-01-9999';
                    newEp.inPlex = false;
                    newEp.itiStatus = ItiLinkStatus.UNKNOWN;
                    newEp.episode = e.episode_number;
                    newEp.season = sub.season;
                    newEp.name = e.name;
                    sub.episodes.push(newEp);
                }
            });
        }
        if (save) {
            this.tvSubRepo.save(sub);
        }

    }

    async checkTvSubscriptions() {
        await this.getTvSubscriptions(false);
        for (const idx in this.tvSubscriptions) {
            if (idx === '0') {
                await this.checkSingleTvSubscription(this.tvSubscriptions[idx]);
            } else {
                await setTimeout(async () => await this.checkSingleTvSubscription(this.tvSubscriptions[idx]) , 10000);
            }
        }
    }

    async checkMovieSubscriptions() {
        await this.getMovieSubscriptions();
        for (const idx in this.movieSubscriptions) {
            if (idx === '0') {
                await this.checkMovieSubscription(this.movieSubscriptions[idx]);
            } else {
                await setTimeout(async () => await this.checkMovieSubscription(this.movieSubscriptions[idx]), 10000);
            }
        }
    }

    async checkMovieSubscription(sub: MovieSubscription) {
        try {
            let failed = false;
            const response = await this.itiService.search({query: sub.name, parent: 'Movies', child: ''});
            const itiError = response as ItiError;
            const itiLinks = response as ItiLinkResponse;
            let highestQualityLink: ItiLink = null;
            let highestQuality: string = sub.currentQuality;
            if (!itiError.error && !itiError.loggedIn) {
                for (let i = 0; i < itiLinks.results.length; i++) {
                    const itiLink = itiLinks.results[i];
                    if (itiLink && this.isBetterQuality(highestQuality, itiLink.tags.join(' '), itiLink.child)) {
                        highestQualityLink = itiLink;
                        highestQuality = itiLink.tags.join(' ') || itiLink.child;
                    }
                }
                if (highestQuality !== sub.currentQuality && highestQualityLink !== null) {
                    await this.jdService.addLinks(highestQualityLink.linkid, highestQualityLink.title);
                    sub.itiStatus = ItiLinkStatus.FOUND;
                    sub.currentQuality = highestQuality;
                    this.movieSubRepo.save(sub);
                }
            } else {
                sub.itiStatus = ItiLinkStatus.NOTFOUND;
                failed = true;
            }
            if (failed) {
                this.movieSubRepo.save(sub);
            }
        }
        catch (e) {
            console.log(e);
        }
    }

    isBetterQuality(currentQuality: string, tags: string, child: string) {
        if (!currentQuality) {
            return true;
        }

        if (currentQuality === 'SD' && child === 'SD') {
            return false;
        }
        if (currentQuality === 'SD' && child === 'HD') {
            return true;
        }
        const currentQualityIndex = this.getQuality(currentQuality);
        const highestQualityIndex = this.getQuality(tags);
        if (highestQualityIndex !== -1 && currentQualityIndex < highestQualityIndex) {
            return true;
        }

        return false;
    }

    getQuality(tags: string) {
        for (let i = this.qualitiesList.length - 1; i >= 0; i--) {
            let isQuality = true;
            this.qualitiesList[i].split(' ').forEach(x => isQuality = isQuality && tags.toUpperCase().includes(x));
            if (isQuality) {
                return i;
            }
        }
        return -1;

    }

    async checkSingleTvSubscription(sub: TvSubscription) {
        try {
            sub.episodes = sub.episodes && sub.episodes.length >= 0 ? sub.episodes : [];
            const missingEpisodes = sub.episodesNotInPlex.filter(e =>
                e.itiStatus !== ItiLinkStatus.NOTFOUND && e.itiStatus !== ItiLinkStatus.ERROR &&
                Date.parse(e.airDate) < Date.now());
            let failed =  false;
            if (missingEpisodes.length > 0) {
                for (const i in missingEpisodes) {
                    if (missingEpisodes[i]) {
                        const episode = missingEpisodes[i];
                        const response = await this.itiService.findEpisode(sub.name, sub.season, episode.episode);
                        const itiError = response as ItiError;
                        const itiLink = response as ItiLink;
                        if (!itiError.error && !itiError.loggedIn) {
                            await this.jdService.addLinks(itiLink.linkid, itiLink.title);
                        } else {
                            episode.itiStatus = ItiLinkStatus.NOTFOUND;
                            failed = true;
                        }
                    }
                }
            }
            if (failed) {
                this.tvSubRepo.save(sub);
            }
        }
        catch (e) {
            console.log(e);
        }
    }
    async removeTvSubscription(name?: string, season?: number, id: number = -1) {
        let found;
        if (id !== -1) {
            found = await this.tvSubRepo.findOne(id);
        } else {
            found = await this.tvSubRepo.findOne({name, season});
        }
        if (found) {
            await this.tvSubRepo.remove(found);
            return true;
        }
        return false;
    }

    async addTvSubscription(name: string, season: number, id: number): Promise<TvSubscription> {

        const found = await this.tvSubRepo.findOne({name, season});
        if (found) {
            return null;
        }
        try {
            const tvSub = new TvSubscription();
            tvSub.created = Date.now();
            const data = await this.tmdbService.getSeason(name, season, id);
            tvSub.tmdbId = data.showId;
            tvSub.name = name;
            tvSub.season = season;
            await this.updateEpisodes(tvSub, false, true);
            await this.tvSubRepo.save(tvSub);
            await this.checkSingleTvSubscription(tvSub);
            return tvSub;
        }
        catch (e) {
            console.log(e);
            return null;
        }
    }

    async removeMovieSubscription(name?: string,  id: number = -1) {
        let found;
        if (id !== -1) {
            found = await this.movieSubRepo.findOne(id);
        } else {
            found = await this.movieSubRepo.findOne({name});
        }
        if (found) {
            await this.movieSubRepo.remove(found);
            return true;
        }
        return false;
    }

    async addMovieSubscription(name: string, highestQuality: string, id: number): Promise<MovieSubscription> {

        const found = await this.movieSubRepo.findOne({name});
        if (found) {
            return null;
        }
        try {
            const movieSubRepo = new MovieSubscription();
            movieSubRepo.created = Date.now();
            const data = await this.tmdbService.getMovie(id);
            movieSubRepo.tmdbId = id;
            movieSubRepo.name = data.title;
            movieSubRepo.airDate = data.release_data;
            movieSubRepo.highestQuality = highestQuality;
            await this.movieSubRepo.save(movieSubRepo);
            await this.checkMovieSubscription(movieSubRepo);
            return movieSubRepo;
        }
        catch (e) {
            console.log(e);
            return null;
        }
    }

}
