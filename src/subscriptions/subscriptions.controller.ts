import { Controller, Get, UseGuards, Post, Body } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { AuthGuard } from '@nestjs/passport';


@UseGuards(AuthGuard())
@Controller('subscriptions')
export class SubscriptionsController {

    constructor(private readonly subService: SubscriptionsService) {}
    @Get('subscriptions')
    getSubscriptions() {
        return this.subService.getSubscriptions()
    }

    @Post('subscriptions')
    addSubscriptions(@Body() body: any) {
        return this.subService.addSubscription(body.name, body.season);
    }
}
