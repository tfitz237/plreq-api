import { Controller, Post, Body } from "@nestjs/common";
import PlexDb from "./plex.db";

@Controller('plex')
export default class PlexController {

    constructor(private readonly plexDb: PlexDb) {}

    @Post('tv-show-exists')
    async tvShowExists(@Body() query: any) {
        return await this.plexDb.tvShowExists(query.name, query.season, query.episode);
    }

    @Post('get-season')
    async tvShowGetSeason(@Body() query: any) {
        return await this.plexDb.getTvEpisodes(query.name, query.season, query.episode);
    }
}