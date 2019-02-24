import { Controller, Get, UseGuards, Post, Body, Delete } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { RolesGuard, Roles } from '../auth/auth.roles';
import { UserLevel } from '../auth/auth.service';


@UseGuards(RolesGuard)
@Controller('subscriptions')
export class SubscriptionsController {

    constructor(private readonly subService: SubscriptionsService) {}

    @Roles(UserLevel.User)
    @Get('tv')
    async getSubscriptions() {
        return await this.subService.getTvSubscriptions();
    }

    @Roles(UserLevel.User)
    @Post('tv')
    async addSubscriptions(@Body() body: any) {
        return await this.subService.addTvSubscription(body.name, body.season, body.id);
    }

    @Roles(UserLevel.Admin)
    @Delete('tv')
    async removeSubscriptions(@Body() body: any) {
        return await this.subService.removeTvSubscription(body.name, body.season, body.id);
    }
}
