import { Controller, Get, Param, UseGuards, Post, Body } from '@nestjs/common';
import { JdService } from './jd.service';
import { jdConnectResponse, jdInit, jdPackage } from "models/jdownloader";
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard())
@Controller('jd')
export class JdController {
    constructor(private readonly jdService: JdService) {}

    @Get('packages/:uuid')
    async  package(@Param('uuid') uuid): Promise<jdPackage|jdInit> {
        return await this.jdService.getPackages(true, uuid) as jdPackage|jdInit;
    }
    
    @Get('packages')
    async packages(): Promise<jdPackage[]|jdInit> {
        return await this.jdService.getPackages(true) as jdPackage[]|jdInit;
    }

    @Post('add-links')
    async addLinks(@Body() request: any): Promise<jdInit> {
        return await this.jdService.addLinks(request.linkId, request.name);
    }

    @Get('clean-up')
    async cleanUp(): Promise<jdInit> {
        return await this.jdService.cleanUp();
    }

}
