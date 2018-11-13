import { Controller, Get, UseGuards, Post, Body, Delete } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { RolesGuard, Roles } from '../auth/auth.roles';
import { UserLevel } from '../auth/auth.service';


@UseGuards(RolesGuard)
@Controller('subscriptions')
export class SubscriptionsController {

    constructor(private readonly subService: SubscriptionsService) {}

    @Roles(UserLevel.User)
    @Get()
    async getSubscriptions() {
        return await this.subService.getSubscriptions();
    }

    @Roles(UserLevel.User)
    @Post()
    async addSubscriptions(@Body() body: any) {
        return await this.subService.addSubscription(body.name, body.season);
    }

    @Roles(UserLevel.Admin)
    @Delete()
    async removeSubscriptions(@Body() body: any) {
        return await this.subService.removeSubscription(body.name, body.season, body.id);
    }
}
