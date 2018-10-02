import { Controller, Get, Param } from '@nestjs/common';
import { JdService, jdConnectResponse, jdInit, jdLink, jdPackage } from './jd.service';

@Controller('jd')
export class JdController {
    constructor(private readonly jdService: JdService) {}

    @Get('connect')
    connect(): Promise<jdConnectResponse> {
        return this.jdService.connect().then(response => response);
        
    }
    @Get('devices')
    devices(): Promise<string> {
        return this.jdService.listDevices().then(response => response);
    }

    @Get('init')
    init(): Promise<jdInit> {
        return this.jdService.initiate().then(response => response);
    }

    @Get('links')
    links(): Promise<jdLink[]> {
        return this.jdService.getLinks().then(response => response);
    }

    @Get('packages/:uuid')
    packages(@Param() params): Promise<jdPackage[]|jdInit> {
        return this.jdService.getPackages(true, params.uuid).then(response => response);
    }
    
    @Get('packages')
    package(): Promise<jdPackage[]|jdInit> {
        return this.jdService.getPackages(true).then(response => response);
    }
}
