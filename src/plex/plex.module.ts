import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SharedModule } from '../shared/shared.module';
import PlexController from './plex.controller';
import PlexDb from './plex.db';

@Module({
    imports: [AuthModule, SharedModule],
    controllers: [PlexController],
    providers: [PlexDb],
    exports: [PlexDb],
})
export class PlexModule {}
