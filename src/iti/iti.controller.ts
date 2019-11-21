import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Roles, RolesGuard } from '../auth/auth.roles';
import { ItiError, ItiLink, ItiLinkResponse, ItiQuery, ItiTvShowQuery } from '../models/iti';
import { UserLevel } from '../shared/constants';
import { ItiService } from './iti.service';

@UseGuards(RolesGuard)
@Controller('iti')
export class ItiController {

    constructor(private readonly itiService: ItiService) {}

    @Roles(UserLevel.User)
    @Post('search')
    async search(@Body() request: ItiQuery): Promise<ItiLinkResponse|ItiError> {
        return await this.itiService.search(request, request.page);
    }

    @Roles(UserLevel.ItiUser)
    @Get('getLinks/:id')
    async getLinks(@Param('id') linkId: string): Promise<any> {
        return await this.itiService.getLinks(linkId);
    }

    @Roles(UserLevel.User)
    @Post('search/tv')
    async getSeason(@Body() request: ItiTvShowQuery, @Param('type') type: string): Promise<any> {
        if (!request.episode) {
            return await this.itiService.findSeason(request.name, request.season);
        } else {
            return [await this.itiService.findEpisode(request.name, request.season, request.episode)];
        }
    }

    @Roles(UserLevel.User)
    @Get('getReferences/:id')
    async getReferences(@Param('id') linkId: string): Promise<any> {
        return await this.itiService.getImageRef(linkId);
    }

}
