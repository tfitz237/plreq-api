import { Module } from '@nestjs/common';
import PlexController from './plex.controller';
import PlexDb from './plex.db';
import { SharedModule } from '../shared/shared.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule, SharedModule],
    controllers: [PlexController],
    providers: [PlexDb]
})
export class PlexModule {}
