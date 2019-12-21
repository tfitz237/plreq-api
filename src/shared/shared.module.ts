import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import Configurations from './configuration/configuration.entity';
import ConfigurationService from './configuration/configuration.service';
import { configProvider } from './configuration/configuration.provider';
import { LogEntry } from './log/log.entry.entity';
import { LogService } from './log/log.service';
import { LogController } from './log/log.controller';

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([LogEntry, Configurations])],
    providers: [ConfigurationService, LogService, configProvider],
    exports: [ConfigurationService, LogService, configProvider],
    controllers: [LogController],
})
export class SharedModule {}
