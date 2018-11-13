import { Controller, Get, Param, UseGuards, Post, Body } from '@nestjs/common';
import { JdService } from './jd.service';
import { jdConnectResponse, jdInit, jdPackage } from "models/jdownloader";
import { RolesGuard, Roles } from '../auth/auth.roles';
import { UserLevel } from '../auth/auth.service';

@UseGuards(RolesGuard)
@Controller('jd')
export class JdController {
    constructor(private readonly jdService: JdService) {}

    @Roles(UserLevel.User)
    @Get('packages/:uuid')
    async  package(@Param('uuid') uuid): Promise<jdPackage|jdInit> {
        return await this.jdService.getPackages(true, uuid) as jdPackage|jdInit;
    }

    @Roles(UserLevel.User)
    @Get('packages')
    async packages(): Promise<jdPackage[]|jdInit> {
        return await this.jdService.getPackages(true) as jdPackage[]|jdInit;
    }

    @Roles(UserLevel.User)
    @Post('add-links')
    async addLinks(@Body() request: any): Promise<jdInit> {
        return await this.jdService.addLinks(request.linkId, request.name);
    }

    @Roles(UserLevel.Admin)
    @Get('clean-up')
    async cleanUp(): Promise<jdInit> {
        return await this.jdService.cleanUp();
    }

}
