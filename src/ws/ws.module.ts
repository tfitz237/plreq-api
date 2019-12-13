import { Module } from '@nestjs/common';
import { ItiModule } from '../iti/iti.module';
import { JdModule } from '../jd/jd.module';
import { PlexModule } from '../plex/plex.module';
import { WsGateway } from './ws.gateway';

@Module({
    imports: [JdModule, ItiModule, PlexModule],
    providers: [WsGateway],
})
export class WsModule {}