import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ItiService } from './iti.service';
import { AuthGuard } from '@nestjs/passport';
import { itiQuery, itiLink, itiError, itiTvShowQuery } from '../models/iti';

@UseGuards(AuthGuard())
@Controller('iti')
export class ItiController {

    constructor(private readonly itiService: ItiService) {}

    @Post('search')
    async search(@Body() request: itiQuery): Promise<itiLink[]|itiError> {
        return await this.itiService.search(request);
    }

    @Get('getLinks/:id')
    async getLinks(@Param('id') linkId: string): Promise<any> {
        return await this.itiService.getLinks(linkId);
    }

    @Post('search/tv')
    async getSeason(@Body() request: itiTvShowQuery, @Param('type') type: string): Promise<any> {
        if (!request.episode) {
            return await this.itiService.findSeason(request.name, request.season);
        } else {
            return [await this.itiService.findEpisode(request.name, request.season, request.episode)];
        }
    }
}
