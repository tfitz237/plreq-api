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
        this.db = await sqlliteOpen(path.join(this.config.plex.dbLocation,'com.plexapp.plugins.library.db'));
    }

    async tvShowExists(name: string, season: number = -1, episode: number = -1): Promise<boolean> {
        await this.connect();
        const data = await this.getTvEpisodes(name, season, episode);
        return data.length > 0;
    }

    async getTvEpisodes(name: string, season: number = -1, episode: number = -1): Promise<Episode[]> {
        await this.connect();
        const data = await this.db.all<Episode>(`
        SELECT DISTINCT 
            parent_index as season, 
            \`index\` as episode, 
            grandparent_title as show, 
            title 
        FROM metadata_item_views 
        WHERE 
            grandparent_title LIKE '%${name}%' 
            ${season != -1 ? `AND parent_index = ${season}`: ''} 
            ${episode != -1 ? `AND \`index\` = ${episode}`: ''} 
        ORDER BY 
            grandparent_title, 
            parent_index, 
            \`index\`, 
            title
        `);

        let data2 = await this.db.all(`SELECT * FROM 
        (SELECT REPLACE(guid, '?lang=en', '%') as showGuid, title as showTitle
        FROM metadata_items 
        WHERE title LIKE '%${name}%') as s 
        LEFT OUTER JOIN metadata_items 
        ON metadata_items.guid LIKE s.showGuid WHERE guid LIKE 'com.plexapp.agents.thetvdb:%' OR guid LIKE 'com.plexapp.agents.imdb:%'`);
        const filteredData2 = [];
        data2.forEach(x => {
            if (season != -1) {
                const match = x.guid.match(/com.plexapp.agents.thetvdb:\/\/\d+(\/(\d+)|\/(\d+)\/(\d+))?\?lang=en/);
                if (match != null && match[4] && 
                    (match[2] == season || match[3] == season) && (episode != -1 && match[4] == episode || episode == -1)
                    ) {
                    filteredData2.push({
                        season: parseInt(match[2] || match[3]),
                        episode: parseInt(match[4]),
                        show: x.showTitle,
                        title: x.title
                    });
                }           
            }
            else if (season == -1 && episode == -1) {
                const match = x.guid.match(/com.plexapp.agents.imdb:\/\/tt\d+(\/(\d+)|\/(\d+)\/(\d+))?/);
                if (match != null) {
                    filteredData2.push({
                        title: x.title
                    });
                }
                
            }
        });
        return data.concat(filteredData2)
            .filter((x, i, a) => {
                if (season != -1 && episode != -1) {
                    return a.findIndex(y => y && y.season == x.season && y.episode == x.episode && y.show == x.show) == i;
                } else if (season != -1) {
                    return a.findIndex(y => y && y.season == x.season && y.show == x.show) == i;
                }
                else {   
                    return true;
                }
            })
            .sort((a, b) => {
                if (season != -1 && episode != -1) {
                    return (a.season * 100 + a.episode) - (b.season * 100 + b.episode);
                } else if (season != -1) {
                    return a.season - b.season;
                } else {
                    return a > b ? 1 : -1;
                }
            })
            ;      
    }

    


}