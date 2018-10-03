import { Controller, Get, Param, UseGuards, Post, Body } from '@nestjs/common';
import { JdService } from './jd.service';
import { jdConnectResponse, jdInit, jdPackage } from "models/jdownloader";
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard())
@Controller('jd')
export class JdController {
    constructor(private readonly jdService: JdService) {}

    @Get('connect')
    async connect(): Promise<jdConnectResponse> {
        return await this.jdService.connect();        
    }

    @Get('init')
    async init(): Promise<jdInit> {
        return await this.jdService.initiate();
    }

    @Get('packages/:uuid')
    async  packages(@Param('uuid') uuid): Promise<jdPackage[]|jdInit> {
        return await this.jdService.getPackages(true, uuid);
    }
    
    @Get('packages')
    async package(): Promise<jdPackage[]|jdInit> {
        return await this.jdService.getPackages(true);
    }

    @Post('add-links')
    async addLinks(@Body() links: string[]) {
        return await this.jdService.addLinks(links, true);
    }
}
