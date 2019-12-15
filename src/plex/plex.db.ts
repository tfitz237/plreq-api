import { Injectable, Inject } from '@nestjs/common';
import * as path from 'path';
import { Database, open as sqlliteOpen } from 'sqlite';
import { Episode } from '../models/plex';
import ConfigurationService from '../shared/configuration/configuration.service';
import { WsGateway } from '../ws/ws.gateway';
import { IConfiguration } from '../models/config';
@Injectable()
export default class PlexDb {
    serverGuid = '4c41cc0c0872f8900cd21d92b15f573ca8dfdd61';
    get serverUrl() { return `http://app.plex.tv/desktop?secure=0#!/server/${this.serverGuid}`; }
    db: Database;
    socket: WsGateway;

    constructor(
        @Inject('CONFIG')
        private readonly config: IConfiguration) {}

    setSocket(socket: WsGateway) {
        this.socket = socket;
    }


    async connect() {
        this.db = await sqlliteOpen(path.join(this.config.plex.dbLocation, 'com.plexapp.plugins.library.db'), {verbose: true});
    }

    async tvShowExists(name: string, season: number = -1, episode: number = -1): Promise<boolean> {
        await this.connect();
        const data = await this.getTvEpisodes(name, season, episode);
        return data.length > 0;
    }

    async movieExists(name: string): Promise<boolean> {
        await this.connect();
        const data = await this.getMovie(name);
        return data.length > 0;
    }

    async getTvShow(name: string)
     {
        await this.connect();
        name = name.replace(/[.*]/g, '').replace(/[^a-zA-Z0-9 :]/g, ' ');
        const words = `title LIKE '%` + name.split(/\s+/).join(`%' AND title LIKE '%`) + `%'`;
        const query = `
        SELECT REPLACE(SUBSTR(REPLACE(REPLACE (d.guid, REPLACE(s.showGuid, '%', ''), ''), '?lang=en',''), 2), '/', '-')
         as season_episode,
s.showTitle as show_title,
d.title as episode_title,
d.id
FROM
	(SELECT REPLACE(guid, '?lang=en', '%') as showGuid, title as showTitle
	FROM metadata_items
    WHERE ${words} AND
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
                    x.episode = parseInt(match[2]);
                }
                x.link = `${this.serverUrl}/details?key=%2Flibrary%2Fmetadata%2F${x.id}`;
                return x;
            }).sort((a, b) => (a.season * 100 + a.episode) - (b.season * 100 + b.episode));
    }

    async getMovie(name: string) {

        await this.connect();
        name = name.replace(/[.*]/g, '').replace(/[^a-zA-Z0-9 :]/g, ' ');
        const words = `title LIKE '%` + name.split(/\s+/).join(`%' AND title LIKE '%`) + `%'`;
        const query = `
        SELECT n.id, n.title, n.originally_available_at, m.width, m.height, m.bitrate, m.video_codec, m.audio_codec
        FROM metadata_items n
        JOIN media_items m ON m.metadata_item_id = n.id
        WHERE ${words} AND
        guid LIKE 'com.plexapp.agents.imdb%'
        `;

        let data = await this.db.all(query);
        data = data.map(x => {
            x.link = `${this.serverUrl}/details?key=%2Flibrary%2Fmetadata%2F${x.id}`;
            return x;
        });
        return data;
    }

    async getTvEpisodes(name: string, season: number = -1, episode: number = -1): Promise<Episode[]> {
           const data = await this.getTvShow(name);
           return data.filter(x => {
               if (season !== -1) {
                   if (episode !== -1) {
                       return x.season === season && x.episode === episode;
                   }
                   return x.season === season;
               }
               return true;
           });
    }

    async getEpisodeList(name: string, season: number = -1) {
        const episodes = await this.getTvEpisodes(name, season);

        return episodes.map(x => x.episode);
    }

}