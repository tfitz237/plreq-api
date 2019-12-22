import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { LogService } from './log.service';
import { LogQuery } from '../../models';
import { RolesGuard, Roles } from '../../auth/auth.roles';
import { UserLevel } from '../../shared/constants';

@Controller('logs')
@UseGuards(RolesGuard)
export class LogController {
    constructor(private readonly logService: LogService) {}

    @Roles(UserLevel.Admin)
    @Post()
    async getLogs(@Body() query: LogQuery) {
        return await this.logService.getLogs(query);
    }
}
