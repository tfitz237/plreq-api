import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { SharedModule } from '../shared/shared.module';

@Module({
    imports: [SharedModule],
    providers: [CronService],
    exports: [CronService],
})
export class CronModule {}