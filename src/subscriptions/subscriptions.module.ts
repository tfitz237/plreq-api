import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TvSubscription } from './subscription.entity';
import { SubscriptionsService } from './subscriptions.service';
import { ItiModule } from '../iti/iti.module';
import { JdModule } from '../jd/jd.module';
import { AuthModule } from '../auth/auth.module';
import { SharedModule } from '../shared/shared.module';

@Module({
    imports: [ TypeOrmModule.forFeature([TvSubscription]), ItiModule, JdModule, AuthModule, SharedModule],
    providers: [SubscriptionsService]
})
export class SubscriptionsModule {}
