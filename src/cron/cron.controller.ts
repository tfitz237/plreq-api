import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { CronService } from './cron.service';
import { RolesGuard, Roles } from '../auth/auth.roles';
import { UserLevel } from '../shared/constants';

@Controller('cron')
@UseGuards(RolesGuard)
export class CronController {
    constructor(private readonly cronService: CronService) {}

    @Roles(UserLevel.Admin)
    @Get('jobs')
    getJobs() {
        return this.cronService.getJobsSerializable();
    }

    @Roles(UserLevel.Admin)
    @Get('job')
    getJob(@Param('id') id: number) {
        return this.cronService.getJob(id);
    }

    @Roles(UserLevel.Admin)
    @Post('job/:id/start')
    startJob(@Param('id') id: number) {
        return this.cronService.startJob(id);
    }

    @Roles(UserLevel.Admin)
    @Post('job/:id/stop')
    stopJob(@Param('id') id: number) {
        return this.cronService.stopJob(id);
    }
}
