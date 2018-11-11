import { Injectable } from "@nestjs/common";
import { open as sqlliteOpen, Database } from 'sqlite';
import { Episode } from "../models/plex";
import Configuration from "../shared/configuration";
import * as path from 'path';
import { WsGateway } from "../ws/ws.gateway";
@Injectable()
export default class PlexDb {
    db: Database;
    socket: WsGateway;

    constructor(private config: Configuration) {}

    setSocket(socket: WsGateway) {
        this.socket = socket;
    }

    async connect() {
        this.db = await sqlliteOpen(path.join(this.config.plex.dbLocation,'com.plexapp.plugins.library.db'), {verbose: true});
    }

    async tvShowExists(name: string, season: number = -1, episode: number = -1): Promise<boolean> {
        await this.connect();
        const data = await this.getTvEpisodes(name, season, episode);
        return data.length > 0;
    }


    async getTvShow(name: string)
     {
        await this.connect();
        const query = `
        SELECT REPLACE(SUBSTR(REPLACE(REPLACE (d.guid, REPLACE(s.showGuid, '%', ''), ''), '?lang=en',''), 2), '/', '-')
         as season_episode, 
s.showTitle as show_title, 
d.title as episode_title
FROM 
	(SELECT REPLACE(guid, '?lang=en', '%') as showGuid, title as showTitle
	FROM metadata_items 
    WHERE title LIKE '%${name}%' AND
    guid NOT LIKE 'com.plexapp.agents.thetvdb://%/%?lang=en' AND guid NOT LIKE 'com.plexapp.agents.thetvdb://%/%?lang=en'
    ) as s 
	LEFT OUTER JOIN metadata_items d 
	ON d.guid LIKE s.showGuid 
	WHERE d.guid LIKE 'com.plexapp.agents.thetvdb://%/%/%?lang=en'`;

            const data = await this.db.all(query);
            
            return data.map(x => {
                const match = x.season_episode.match(/(\d+)-(\d+)/);
                if (match) {
                    x.season = parseInt(match[1]);
                    x.episode = parseInt(match[2])
                }
                return x;
            }).sort((a, b) => (a.season * 100 + a.episode) - (b.season * 100 + b.episode));
    }

    async getMovie(name: string) {
        await this.connect();
        const query = `
        SELECT title FROM metadata_items WHERE title LIKE '%${name}%' AND guid LIKE 'com.plexapp.agents.imdb%'
        `;

        const data = await this.db.all(query);

        return data;
    }
    

    async getTvEpisodes(name: string, season: number = -1, episode: number = -1): Promise<Episode[]> {
           const data = await this.getTvShow(name);
           return data.filter(x => {
               if (season != -1) {
                   if (episode != -1) {
                       return x.season == season && x.episode == episode;
                   }
                   return x.season == season;
               }
               return true;
           })
    }

    async getEpisodeList(name: string, season: number = -1) {
        const episodes = await this.getTvEpisodes(name, season);

        return episodes.map(x => x.episode);
    }

    


}