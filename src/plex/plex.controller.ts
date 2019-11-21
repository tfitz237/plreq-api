import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Roles, RolesGuard } from '../auth/auth.roles';
import { UserLevel } from '../shared/constants';
import PlexDb from './plex.db';

@UseGuards(RolesGuard)
@Controller('plex')
export default class PlexController {

    constructor(private readonly plexDb: PlexDb) {}

    @Roles(UserLevel.User)
    @Post('tv-show-exists')
    async tvShowExists(@Body() query: any) {
        return await this.plexDb.tvShowExists(query.name, query.season, query.episode);
    }

    @Roles(UserLevel.User)
    @Post('get-season')
    async tvShowGetSeason(@Body() query: any) {
        return await this.plexDb.getTvEpisodes(query.name, query.season, query.episode);
    }

    @Roles(UserLevel.User)
    @Post('get-show')
    async getTvShow(@Body() query: any) {
        return await this.plexDb.getTvShow(query.name);
    }

    @Roles(UserLevel.User)
    @Post('get-movie')
    async getMovie(@Body() query: any) {
        return await this.plexDb.getMovie(query.name);
    }
}