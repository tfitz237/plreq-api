import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ItiService } from './iti.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard())
@Controller('iti')
export class ItiController {

    constructor(private readonly itiService: ItiService) {}

    @Post('search')
    async search(@Body() request: any): Promise<any> {
        return await this.itiService.search(request.query);
    }

    @Get('getLinks/:id')
    async getLinks(@Param('id') linkId: number): Promise<any> {
        return await this.itiService.getLinks(linkId);
    }

}
