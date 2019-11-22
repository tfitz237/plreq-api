import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ItiModule } from '../iti/iti.module';
import { JdModule } from '../jd/jd.module';
import { PlexModule } from '../plex/plex.module';
import { SharedModule } from '../shared/shared.module';
import { WsGateway } from './ws.gateway';

@Module({
    imports: [SharedModule, AuthModule, JdModule, ItiModule, PlexModule],
    // providers: [WsGateway]
})
export class WsModule {}