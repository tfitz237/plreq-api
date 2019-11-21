import { Controller, Get, UseGuards, Post, Body, Delete, Param } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { RolesGuard, Roles } from '../auth/auth.roles';
import { UserLevel } from '../auth/auth.service';

@UseGuards(RolesGuard)
@Controller('subscriptions')
export class SubscriptionsController {

    constructor(private readonly subService: SubscriptionsService) {}

    @Roles(UserLevel.User)
    @Get('tv')
    async getTvSubscriptions() {
        return await this.subService.getTvSubscriptions();
    }

    @Roles(UserLevel.User)
    @Get('tv/:id')
    async getTvSubscription(@Param('id') id: any) {
        return await this.subService.getTvSubscription(id);
    }

    @Roles(UserLevel.User)
    @Get('movie')
    async getMovieSubscriptions() {
        return await this.subService.getMovieSubscriptions();
    }

    @Roles(UserLevel.User)
    @Post('movie')
    async addMovieSubscriptions(@Body() body: any) {
        return await this.subService.addMovieSubscription(body.name, body.highestQuality, body.id);
    }

    @Roles(UserLevel.User)
    @Post('tv')
    async addSubscriptions(@Body() body: any) {
        return await this.subService.addTvSubscription(body.name, body.season, body.id);
    }

    @Roles(UserLevel.User)
    @Delete('tv')
    async removeSubscriptions(@Body() body: any) {
        return await this.subService.removeTvSubscription(body.name, body.season, body.id);
    }

    @Roles(UserLevel.User)
    @Delete('movie')
    async removeMovieSubscription(@Body() body: any) {
        return await this.subService.removeMovieSubscription(body.name, body.id);
    }
}
