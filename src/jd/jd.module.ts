import { Module, UseGuards } from '@nestjs/common';
import { JdService } from './jd.service';
import { JdController } from './jd.controller';
import { AuthModule } from '../auth/auth.module';


@Module({
    imports: [AuthModule],
    controllers: [JdController, ],
    providers: [JdService,]
})
export class JdModule {}
