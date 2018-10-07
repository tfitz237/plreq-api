import { Module, UseGuards } from '@nestjs/common';
import { JdService } from './jd.service';
import { JdController } from './jd.controller';
import { AuthModule } from '../auth/auth.module';
import FileService from './file.service';


@Module({
    imports: [AuthModule],
    controllers: [JdController, ],
    providers: [JdService, FileService]
})
export class JdModule {}
