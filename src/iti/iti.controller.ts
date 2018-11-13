import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ItiService } from './iti.service';
import { itiQuery, itiLink, itiError, itiTvShowQuery } from '../models/iti';
import { RolesGuard, Roles } from '../auth/auth.roles';
import { UserLevel } from '../auth/auth.service';

@UseGuards(RolesGuard)
@Controller('iti')
export class ItiController {

    constructor(private readonly itiService: ItiService) {}

    @Roles(UserLevel.User)
    @Post('search')
    async search(@Body() request: itiQuery): Promise<itiLink[]|itiError> {
        return await this.itiService.search(request);
    }

    @Roles(UserLevel.ItiUser)
    @Get('getLinks/:id')
    async getLinks(@Param('id') linkId: string): Promise<any> {
        return await this.itiService.getLinks(linkId);
    }

    @Roles(UserLevel.User)
    @Post('search/tv')
    async getSeason(@Body() request: itiTvShowQuery, @Param('type') type: string): Promise<any> {
        if (!request.episode) {
            return await this.itiService.findSeason(request.name, request.season);
        } else {
            return [await this.itiService.findEpisode(request.name, request.season, request.episode)];
        }
    } 
}
