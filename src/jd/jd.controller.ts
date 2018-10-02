import { Controller, Get, Param, UseGuards, Post, Body } from '@nestjs/common';
import { JdService, jdConnectResponse, jdInit, jdLink, jdPackage } from './jd.service';
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
    async  packages(@Param() params): Promise<jdPackage[]|jdInit> {
        return await this.jdService.getPackages(true, params.uuid);
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
