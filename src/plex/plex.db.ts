import { Injectable } from "@nestjs/common";
import { open as sqlliteOpen, Database } from 'sqlite';
import { Episode } from "../models/plex";
import Configuration from "../shared/configuration";
import * as path from 'path';
@Injectable()
export default class PlexDb {
    db: Database;

    constructor(private config: Configuration) {}
    async connect() {
        this.db = await sqlliteOpen(path.join(this.config.plex.dbLocation + 'com.plexapp.plugins.library.db'));
    }

    async tvShowExists(name: string, season: number): Promise<boolean> {
        await this.connect();
        const count = await this.db.get<number>(`SELECT COUNT(id) FROM metadata_item_views WHERE grandparent_title LIKE '%${name}%' AND parent_index = ${season}`);
        return count > 0;
    }

    async getTvSeason(name: string, season: number = -1): Promise<Episode[]> {
        await this.connect();
        const data = await this.db.all<Episode>(`SELECT DISTINCT parent_index as season, \`index\` as episode, grandparent_title as show, title FROM metadata_item_views WHERE grandparent_title LIKE '%${name}%' ${season != -1 ? `AND parent_index = ${season}`: ''} ORDER BY grandparent_title, parent_index, \`index\`, title`);
        return data;      
    }


}