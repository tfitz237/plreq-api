import { Controller, UseGuards, Post, Body } from '@nestjs/common';
import { RolesGuard, Roles } from '../auth/auth.roles';
import { UserLevel } from '../auth/auth.service';
import { itiTvShowQuery } from '../models/iti';
import { TmdbService } from './tmdb.service';

@UseGuards(RolesGuard)
@Controller('tmdb')
export class TmdbController {

    constructor(private tmdbService: TmdbService) {}

    @Roles(UserLevel.User)
    @Post('tv')
    async searchForShow(@Body() request: itiTvShowQuery): Promise<any> {
        if (request.id) {
            return await this.tmdbService.getShowSeasons(request.id);
        }
        return await this.tmdbService.searchForShow(request.name);
    }

    @Roles(UserLevel.User)
    @Post('movie')
    async searchForMovie(@Body() request: itiTvShowQuery): Promise<any> {
        if (request.id) {
            return await this.tmdbService.getMovie(request.id);
        }
        return await this.tmdbService.searchForMovie(request.name);
    }

}
