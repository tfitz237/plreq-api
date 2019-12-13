import { Module } from '@nestjs/common';
import PlexController from './plex.controller';
import PlexDb from './plex.db';

@Module({
    imports: [],
    controllers: [PlexController],
    providers: [PlexDb],
    exports: [PlexDb],
})
export class PlexModule {}
