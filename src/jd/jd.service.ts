import { Injectable, HttpException } from '@nestjs/common';
import * as jdApi from 'jdownloader-api';
import Credentials from '../shared/credentials';
import { jdLink, jdConnectResponse, jdInit, jdPackage } from '../models/jdownloader';
import FileService from 'shared/file';
@Injectable()
export class JdService {
    isConnected: boolean = false;
    deviceId: string;
    links: jdLink[] = [];
    creds: Credentials;
    packageUuids: string[];
    packages: jdPackage[] = [];
     
    pollPackages: boolean;
    constructor(private readonly fileService: FileService) {
        this.creds = new Credentials();
        this.pollPackages = true; 
    }

    get isInitiated() : boolean { return this.isConnected && !!this.deviceId };

    async connect(): Promise<jdConnectResponse> {

        try {
            const response = await jdApi.connect(this.creds.jd.email, this.creds.jd.password);
            if (response === true) {   
                this.isConnected = true;                         
                return {
                    connected: true
                };
            } else {
                throw new HttpException({
                    connected: false,
                    error: response.error
                }, 400);;
            }
        }
        catch (response) {
            throw new HttpException({
                connected: false,
                error: JSON.parse(response.error)
            }, 400);
        }
    }

    async initiate(): Promise<jdInit> {
        if (this.isInitiated) {
            return {
                id: this.deviceId,
                success: true,
                packages: this.packages
            };
        }
        const response = !this.isConnected ? await this.connect() : {connected: true};
        
        if (!response.connected) {
            throw new HttpException({
                success: false,
                error: response.error
            }, 400);
        }
        const deviceId = await this.listDevices();
        if (deviceId) {
            var packages = <jdPackage[]>(await this.getPackages());

            if (this.pollPackages) {
                this.setupPollingCache();
            }

            return {
                id: deviceId,
                success: true,
                packages: packages
            };
        } else {
            throw new HttpException({
                success: false,
                error: {
                    src: "API",
                    type: "NO_DEVICES_FOUND"
                }
            }, 400)
        }
        
    }

    private setupPollingCache() {
        this.pollPackages = false;
        setInterval(async () => {
            await this.getPackages(false, null, false);
            if (this.packagesFinished(true)) {
                this.fileService.moveVideos();
            }
        }, 2000);
    }
   
    private packagesFinished(stopOnExtracted: boolean): boolean {
        return this.packages.every(pack => {           
            return stopOnExtracted ? pack.finished || !pack.status.includes('Extracting') : pack.finished;
        })
    }

    private async listDevices(): Promise<string> {
        if (!this.deviceId) {
            try {
                const devices = await jdApi.listDevices();
                if (devices.length > 0) {
                    this.deviceId = devices[0].id;
                    return devices[0].id;
                }
            }
            catch {}
            return null;
                
        } else {
            return this.deviceId;
        }

    }

    private async getLinks(): Promise<jdLink[]> {
        const response = await this.initiate()
        if (response.success) {
            try {
                const links = await jdApi.queryLinks(this.deviceId)
                this.links = links.data;
                return links.data;
            } 
            catch {}           
        }
        return [];
    }

    async getPackages(cachedLinks: boolean = false, uuids: string = null, cachedPackages: boolean = true): Promise<jdPackage[]|jdInit> {
        if (cachedPackages && this.packages.length > 0) {
            return this.packages;
        }
        const response = await this.initiate();
        if (response.success) {
            var packages;
            if (uuids) {
                packages = uuids;
            }
            if (cachedLinks && this.links.length > 0) {
                packages = Array.from(new Set(this.links.map(link => link.packageUUID)));
            } else {
                try {
                    packages = Array.from(new Set((await this.getLinks()).map(link => link.packageUUID)));
                }
                catch {}
            }
            if (packages) {
                try {
                    const pck = await jdApi.queryPackages(this.deviceId, packages);
                    pck.data = pck.data.map(this.addPackageDetails);

                    this.packageUuids = packages;
                    this.packages = pck.data;
                    return pck.data;
                } catch {}
            }

            throw new HttpException({
                success: false,
                error: {
                    src: 'api',
                    type: 'UUIDs not found'
                }
            }, 400)

        } else {
            throw new HttpException(response, 400);
        }
    }

    private addPackageDetails(pack: jdPackage) {        
        pack.progressPercent = Math.round(pack.bytesLoaded / pack.bytesTotal * 10000) / 100;
        pack.speedInMb = Math.round(pack.speed / 10000) / 100;
        var fullSeconds = (pack.bytesTotal - pack.bytesLoaded) / pack.speed;
        var minutes = fullSeconds / 60;
        var seconds = Math.floor(minutes) - Math.round(Math.floor(minutes) * 100) / 100 / 60;
        pack.progress = {
            percent: pack.progressPercent + '%',
            eta: Math.floor(minutes) + 'm' + Math.floor(seconds) + 's',
            speedInMb: pack.speedInMb + 'mb/s'
        }
        return pack;
        
    }

    async addLinks(links: string[], autoStart: boolean = true): Promise<jdInit> {
        const response = await this.initiate();
        if (response.success) {
            const linksString = links.join(' ');
            let resp;
            try {
                resp = await jdApi.addLinks(linksString, this.deviceId, autoStart);
                return { success: true};
            } catch (e) {
                throw new HttpException({
                    success: false,
                    error: e.error
                }, 400);
            }
        } else {
            throw new HttpException(response, 400);
        }
    }

}

