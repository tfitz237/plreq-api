import { Module, UseGuards } from '@nestjs/common';
import { JdService } from './jd.service';
import { JdController } from './jd.controller';
import { AuthModule } from '../auth/auth.module';
import FileService from './file.service';
import { SharedModule } from '../shared/shared.module';


@Module({
    imports: [AuthModule,SharedModule],
    controllers: [JdController ],
    providers: [JdService, FileService],
    exports: [JdService, FileService]
})
export class JdModule {}
