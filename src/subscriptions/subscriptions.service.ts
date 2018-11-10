import { Injectable } from '@nestjs/common';

import { Repository } from 'typeorm';
import { TvSubscription } from '../subscriptions/subscription.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { LogMe, Logger } from '../shared/log.service';
import { ItiService } from '../iti/iti.service';
import { JdService } from '../jd/jd.service';
import { TmdbService } from '../iti/tmdb.service';
import { itiLink, itiError } from '../models/iti';
import PlexDb from '../plex/plex.db';
import { TvEpisode, ItiLinkStatus } from './suscription.episode.entity';
@Injectable()
export class SubscriptionsService extends LogMe{

    subscriptions: TvSubscription[] = [];
    constructor(
        @InjectRepository(TvSubscription) private readonly tvSubRepo: Repository<TvSubscription>, 
    private readonly logService: Logger,
    private readonly itiService: ItiService,
    private readonly jdService: JdService,
    private readonly tmdbService: TmdbService,
    private readonly plexDb: PlexDb
    ) {
        super(logService);
        this.setupPolling();
    }

    
    async setupPolling() {
        this.checkSubscriptions();
        setInterval(this.checkSubscriptions, 1000 * 60 * 60 * 6)
    }

    
    async getSubscriptions(): Promise<TvSubscription[]> {
        const subs = await this.tvSubRepo.find();
        for (let i in subs) {
            const sub = subs[i];
            await this.updateEpisodes(sub);
            const idx = this.subscriptions.findIndex(s => s.id == sub.id);            
            if (idx != -1) {
                Object.assign(this.subscriptions[idx], sub);
            } else {                          
                this.subscriptions.push(sub);
            }           
        }
        this.subscriptions.forEach((sub,idx) => {
            if (subs.findIndex(x => x.id == sub.id) == -1) {
                this.subscriptions.splice(idx, 1);
            }
        })
        return this.subscriptions;
    }

    async updateEpisodes(sub: TvSubscription, save: boolean = true) {
        sub.episodes = sub.episodes && sub.episodes.length >= 0 ? sub.episodes : [];
        const eps = await this.tmdbService.getSeason(sub.name, sub.season, sub.tmdbId);
        const allEpisodes = eps.episodes;

        const episodes = await this.plexDb.getEpisodeList(sub.name, sub.season);
        if (sub.episodesInPlex && sub.episodesInPlex.length != episodes.length) {
            episodes.forEach(e => {
                const found = sub.episodes.find(x => x.episode == e);
                if (!found) {
                    const newEp = new TvEpisode();
                    const details = allEpisodes.find(x => x.episode_number == e);
                    newEp.airDate = details ? details.air_date || "01-01-9999" : "01-01-9999";
                    newEp.inPlex = true;
                    newEp.itiStatus = ItiLinkStatus.DOWNLOADED;
                    newEp.episode = e;
                    newEp.season = sub.season;
                    newEp.name = details ? details.name : 'Episode '+ newEp.episode;
                    sub.episodes.push(newEp);
                }
            })
        }
        if (allEpisodes.length != sub.numberOfEpisodes) {
            const missingEpisodes = allEpisodes.filter(x => sub.episodeNumbers.indexOf(x.episode_number) == -1);
            missingEpisodes.forEach(e => {
                const found = sub.episodesNotInPlex.find(ep => ep.episode == e.episode_number && (ep.itiStatus != ItiLinkStatus.ERROR && ep.itiStatus != ItiLinkStatus.NOTFOUND));
                if (!found) {
                    const newEp = new TvEpisode();
                    newEp.airDate = e.air_date || "01-01-9999";
                    newEp.inPlex = false;
                    newEp.itiStatus = ItiLinkStatus.UNKNOWN;
                    newEp.episode = e.episode_number;
                    newEp.season = sub.season;
                    newEp.name = e.name;
                    sub.episodes.push(newEp)
                }
            })   
        }
        if (save) {
            this.tvSubRepo.save(sub);
        }
            
    }
    async checkSubscriptions() {
        await this.getSubscriptions();
        for(let idx in this.subscriptions) {
            if (idx == "0") {
                await this.checkSingleSubscription(this.subscriptions[idx])
            } else {
                await setTimeout(async () => await this.checkSingleSubscription(this.subscriptions[idx]) , 2000);
            }
        }
    }

    async checkSingleSubscription(sub: TvSubscription) {
        try {
            const missingEpisodes = sub.episodesNotInPlex.filter(e => 
                e.itiStatus != ItiLinkStatus.NOTFOUND && e.itiStatus != ItiLinkStatus.ERROR &&
                Date.parse(e.airDate) < Date.now());
            let failed =  false;
            if (missingEpisodes.length > 0) {    
                for(var i in missingEpisodes) {
                    let episode = missingEpisodes[i];
                    const response = await this.itiService.findEpisode(sub.name, sub.season, episode);
                    const itiError = response as itiError;
                    const itiLink = response as itiLink;
                    if (!itiError.error && !itiError.loggedIn) {
                        await this.jdService.addLinks(itiLink.linkid, itiLink.title);
                    } else {
                        episode.itiStatus = ItiLinkStatus.NOTFOUND;
                        failed = true;
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
    async removeSubscription(name?: string, season?: number, id: number = -1) {
        let found;
        if (id != -1) {
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

    async addSubscription(name: string, season: number): Promise<TvSubscription> {
        
        const found = await this.tvSubRepo.findOne({name, season});
        if (found) {
            return null;
        }
        try {
            const tvSub = new TvSubscription();
            tvSub.created = Date.now();
            const data = await this.tmdbService.getSeason(name, season);
            tvSub.tmdbId = data.showId;
            tvSub.name = name;
            tvSub.season = season;
            await this.updateEpisodes(tvSub, false);
            await this.tvSubRepo.save(tvSub);
            await this.checkSingleSubscription(tvSub);
            return tvSub;
        }
        catch (e) {
            console.log(e);
            return null;
        }
    }

}
