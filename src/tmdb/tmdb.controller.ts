import { Controller, UseGuards, Post, Body } from '@nestjs/common';
import { RolesGuard, Roles } from '../auth/auth.roles';
import { UserLevel } from '../shared/constants';
import { ItiTvShowQuery } from '../models/iti';
import { TmdbService } from './tmdb.service';

@UseGuards(RolesGuard)
@Controller('tmdb')
export class TmdbController {

    constructor(private tmdbService: TmdbService) {}

    @Roles(UserLevel.User)
    @Post('tv')
    async searchForShow(@Body() request: ItiTvShowQuery): Promise<any> {
        if (request.id) {
            return await this.tmdbService.getShowSeasons(request.id);
        }
        return await this.tmdbService.searchForShow(request.name);
    }

    @Roles(UserLevel.User)
    @Post('movie')
    async searchForMovie(@Body() request: ItiTvShowQuery): Promise<any> {
        if (request.id) {
            return await this.tmdbService.getMovie(request.id);
        }
        return await this.tmdbService.searchForMovie(request.name, request.single);
    }

}
