import { Injectable } from '@nestjs/common';

import { Repository } from 'typeorm';
import { TvSubscription } from '../subscriptions/subscription.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { LogMe, Logger } from '../shared/log.service';
import { ItiService } from '../iti/iti.service';
import { JdService } from '../jd/jd.service';
import { TmdbService } from '../iti/tmdb.service';
import { itiLink } from '../models/iti';
@Injectable()
export class SubscriptionsService extends LogMe{

    subscriptions: TvSubscription[] = [];
    constructor(
        @InjectRepository(TvSubscription) private readonly tvSubRepo: Repository<TvSubscription>, 
    private readonly logService: Logger,
    private readonly itiService: ItiService,
    private readonly jdService: JdService,
    private readonly tmdbService: TmdbService
    ) {
        super(logService);
        this.setupPolling();
    }

    
    async setupPolling() {
        this.checkSubscriptions();
        setInterval(this.checkSubscriptions, 1000 * 60 * 60 * 24)
    }

    
    async getSubscriptions() {
        const subs = await this.tvSubRepo.find();
        subs.forEach(sub => {
            const idx = this.subscriptions.findIndex(s => s.id == sub.id);
            if (idx != -1) {
                Object.assign(this.subscriptions[idx], sub);
            } else {
                this.subscriptions.push(sub);
            }
        });
    }

    async checkSubscriptions() {
        this.getSubscriptions();
        await this.subscriptions.forEach(async sub => {
            const allEpisodes = await this.tmdbService.getSeason(sub.name, sub.season);
            const missingEpisodes = allEpisodes.filter(e => sub.HasEpisodes.indexOf(e) != -1);
            await missingEpisodes.forEach(async episode => {
                const itiLink = await this.itiService.findEpisode(sub.name, sub.season, episode) as itiLink;
                await this.jdService.addLinks(itiLink.linkid, itiLink.title);
            });
        });
    }

}
