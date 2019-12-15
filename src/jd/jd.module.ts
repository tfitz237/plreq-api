import { Module, UseGuards } from '@nestjs/common';
import { ItiModule } from '../iti/iti.module';
import FileService from './file.service';
import { JdController } from './jd.controller';
import { JdService } from './jd.service';
import { CronModule } from '../cron/cron.module';

@Module({
    imports: [ItiModule, CronModule],
    controllers: [JdController ],
    providers: [JdService, FileService],
    exports: [JdService, FileService],
})
export class JdModule {}
