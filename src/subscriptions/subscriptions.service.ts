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
        setInterval(this.checkSubscriptions, 1000 * 60 * 60 * 24)
    }

    
    async getSubscriptions(): Promise<TvSubscription[]> {
        const subs = await this.tvSubRepo.find();
        for (let i in subs) {
            const sub = subs[i];
            const idx = this.subscriptions.findIndex(s => s.id == sub.id);
            if (idx != -1) {
                sub.HasEpisodes = await this.plexDb.getEpisodeList(sub.name, sub.season);
                Object.assign(this.subscriptions[idx], sub);
            } else {                
                sub.HasEpisodes = await this.plexDb.getEpisodeList(sub.name, sub.season);               
                this.subscriptions.push(sub);
            }
        }
        return this.subscriptions;
    }

    async checkSubscriptions() {
        await this.getSubscriptions();
        for(let idx in this.subscriptions) {
            const sub = this.subscriptions[idx];
            const allEpisodes = await this.tmdbService.getSeason(sub.name, sub.season);
            const missingEpisodes = allEpisodes.filter(e => sub.HasEpisodes.indexOf(e) == -1);
            if (missingEpisodes.length > 0) {    
                for(var i in missingEpisodes) {
                    const episode = missingEpisodes[i];
                    const response = await this.itiService.findEpisode(sub.name, sub.season, episode);
                    const itiError = response as itiError;
                    const itiLink = response as itiLink;
                    if (!itiError.error && !itiError.loggedIn) {
                        await this.jdService.addLinks(itiLink.linkid, itiLink.title);
                    }
                }
            }
            
        }
    }

    async addSubscription(name: string, season: number): Promise<boolean> {
        
        const found = await this.tvSubRepo.findOne({name, season});
        if (found) {
            return false;
        }
        try {
            const tvSub = new TvSubscription();
            tvSub.created = Date.now();
            tvSub.numberOfEpisodes = (await this.tmdbService.getSeason(name, season)).length;
            tvSub.HasEpisodes = await this.plexDb.getEpisodeList(name, season);
            tvSub.name = name;
            tvSub.season = season;
            await this.tvSubRepo.save(tvSub);
            await this.checkSubscriptions();
        }
        catch (e) {
            console.log(e);
            return false;
        }


        return true;
    }

}
