import { Controller, Get, UseGuards, Post, Body, Delete } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { AuthGuard } from '@nestjs/passport';


@UseGuards(AuthGuard())
@Controller('subscriptions')
export class SubscriptionsController {

    constructor(private readonly subService: SubscriptionsService) {}
    @Get()
    async getSubscriptions() {
        return await this.subService.getSubscriptions();
    }

    @Post()
    async addSubscriptions(@Body() body: any) {
        return await this.subService.addSubscription(body.name, body.season);
    }

    @Delete()
    async removeSubscriptions(@Body() body: any) {
        return await this.subService.removeSubscription(body.name, body.season, body.id);
    }
}
