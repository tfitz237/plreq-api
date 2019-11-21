import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JdConnectResponse, JdInit, JdPackage } from 'models/jdownloader';
import { Roles, RolesGuard } from '../auth/auth.roles';
import { UserLevel } from '../shared/constants';
import { JdService } from './jd.service';

@UseGuards(RolesGuard)
@Controller('jd')
export class JdController {
    constructor(private readonly jdService: JdService) {}

    @Roles(UserLevel.User)
    @Get('packages/:uuid')
    async  package(@Param('uuid') uuid): Promise<JdPackage|JdInit> {
        return await this.jdService.getPackages(true, uuid) as JdPackage|JdInit;
    }

    @Roles(UserLevel.User)
    @Get('packages')
    async packages(): Promise<JdPackage[]|JdInit> {
        return await this.jdService.getPackages(true) as JdPackage[]|JdInit;
    }

    @Roles(UserLevel.User)
    @Post('add-links')
    async addLinks(@Body() request: any): Promise<JdInit> {
        return await this.jdService.addLinks(request.linkId, request.name);
    }

    @Roles(UserLevel.Admin)
    @Get('clean-up')
    async cleanUp(): Promise<JdInit> {
        return await this.jdService.cleanUp();
    }

    @Roles(UserLevel.User)
    @Post('remove-package')
    async removePackage(@Body() body): Promise<JdInit> {
        return await this.jdService.removePackage(body);
    }

}
