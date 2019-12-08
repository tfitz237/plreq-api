import { Module, UseGuards } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ItiModule } from '../iti/iti.module';
import { SharedModule } from '../shared/shared.module';
import FileService from './file.service';
import { JdController } from './jd.controller';
import { JdService } from './jd.service';
import { CronModule } from '../cron/cron.module';

@Module({
    imports: [AuthModule, SharedModule, ItiModule, CronModule],
    controllers: [JdController ],
    providers: [JdService, FileService],
    exports: [JdService, FileService],
})
export class JdModule {}
