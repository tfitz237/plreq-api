import { Injectable, HttpException } from '@nestjs/common';
import * as jdApi from 'jdownloader-api';
import Configuration from '../shared/configuration';
import { jdLink, jdConnectResponse, jdInit, jdPackage } from '../models/jdownloader';
import FileService from './file.service';
import { WsGateway } from '../ws/ws.gateway';
import { Logger, LogMe } from '../shared/log.service';
import { LogLevel } from '../shared/log.entry.entity';
import { ItiService } from '../iti/iti.service';
@Injectable()
export class JdService extends LogMe {
    isConnected: boolean = false;
    deviceId: string;
    links: jdLink[] = [];
    packages: jdPackage[] = [];
    pollPackages: boolean = true;
    private socket: WsGateway;
    constructor(private readonly fileService: FileService, 
        private readonly config: Configuration, private readonly logService: Logger, private readonly itiService: ItiService) {
            super(logService)
    }

    setSocket(socket: WsGateway) {
        this.socket = socket;
        this.initiate();
    }

    get isInitiated() : boolean { return this.isConnected && !!this.deviceId };

    async connect(): Promise<jdConnectResponse> {
        try {
            const response = await jdApi.connect(this.config.jd.email, this.config.jd.password);
            if (response === true) {   
                this.isConnected = true;                         
                return {
                    connected: true
                };
            } else {
                throw response;
            }
        }
        catch (response) {
            throw new HttpException({
                connected: false,
                error: (response.error && response.error.src) ? response.error : JSON.parse(response.error)
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
            this.logError(this.initiate, 'Could not connect to Jdownloader', response.error);
            throw new HttpException({
                success: false,
                error: response.error
            }, 400);
        }
        const deviceId = await this.listDevices();
        if (deviceId) {
            var packages = <jdPackage[]>(await this.getPackages());
            await this.movePackages();
            if (this.pollPackages) {
                this.setupPollingCache();
            }
            await this.logInfo(this.initiate, "Initated connection with Jdownloader");
            return {
                id: deviceId,
                success: true,
                packages: packages
            };
        } else {
            this.logError(this.initiate, 'No Jdownloader Devices found.');
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
            if (this.socket && this.socket.server)
                this.socket.server.to(this.socket.authorizedGuid).emit('packages', this.packages);
        }, 2000);
        setInterval(async () => {
            await this.movePackages();
        }, 60000);
    }

    async movePackages(): Promise<jdInit> {
        if (this.anyPackagesFinished(true)) {
            const [success, packages] =  await this.fileService.moveVideos(this.finishedPackages);
            const movedPackages = packages.filter(x => x.files.every(y => y && y.moved));
            await this.logInfo(this.movePackages, `Moved videos: ${movedPackages.map(x=>`${x.files.length} files: ${x.files.length > 0 ? x.files[0].fileName: 'No files moved'} to ${x.files.length > 0 ? x.files[0].destination : 'destination'}`)}`);
            if (movedPackages.length > 0) {
                const cleaned = await this.cleanUp(movedPackages);
                return cleaned;
            }
            return {
                success: success
            }
            
        }

        return {
            success: false
        }
    }

    private get finishedPackages() {
        return this.packages.filter(pack => pack.finished && pack.status && pack.status.includes("Extraction OK"));
    }

    private anyPackagesFinished(stopOnExtracted: boolean): boolean {
        if (this.finishedPackages.length > 0) {
            if (stopOnExtracted) {                
                const extracting = this.packages.filter(pack => pack.status && pack.status.includes('Extracting'));
                return extracting.length == 0;
            }
            return true;
        }
    }

    async cleanUp(finished: jdPackage[] = this.finishedPackages): Promise<jdInit> {     
        try {
            await this.logInfo(this.cleanUp, `Cleaning up ${finished.length} packages named: ${finished.map(x => x.name).join(', ')}`)
            let result = await jdApi.cleanUp(this.deviceId, finished.map(x => x.uuid));
            const packages = await this.getPackages(false, null, false) as jdPackage[];
            if (packages.length == 0) {
                result = result && this.fileService.cleanUp();
            }
            if (result) {
                return {
                    success: true
                };
            }
        } catch (e) {
            console.error(e);
            return {
                success: false
            };
        }
    }

    async removePackage(pkg: jdPackage): Promise<jdInit> {
        try {
            await this.logInfo(this.removePackage, `Removing download package named: ${pkg.name}`);
            let result = await jdApi.cleanUp(this.deviceId, [pkg.uuid], "DELETE_ALL");
            const packages = await this.getPackages(false, null, false) as jdPackage[];
            return {
                success: packages ? packages.findIndex(x => x.uuid == pkg.uuid) == -1 : false
            }
        } catch (e) {
            console.error(e);
            return {
                success: false
            };
        }
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

    async getPackages(cachedLinks: boolean = false, uuids: string = null, cachedPackages: boolean = true): Promise<jdPackage[]|jdPackage|jdInit> {
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
                    pck.data.forEach(p => {
                        p = this.addPackageDetails(p);
                        const pa = this.packages.find(x => x.uuid == p.uuid);
                        if (pa) {
                            Object.assign(pa, p);
                        } else {
                            this.packages.push(p);
                        }
                        
                    });
                    this.packages.forEach((pac, idx) => {
                        const a = pck.data.findIndex(x => x.uuid == pac.uuid);
                        if (a == -1) {
                            this.packages.splice(idx, 1);
                        }
                    })                   
                    if (pck.data.length == 1) {
                        return pck.data[0];
                    }
                    return pck.data;
                } catch {}
            }
            await this.logError(this.getPackages, `Error finding packages`, null);
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
            speedInMb: isNaN(pack.speedInMb) ? '0' : pack.speedInMb + 'mb/s'
        };

        if (pack.status && pack.status.includes('Extracting')) {
            pack.extracting = true;
            const match = pack.status.match(/Extracting \(ETA: ((\d+)?m?:?(\d+)s)\).*/);
            if (match) {
                pack.progress.extraction = match[1];
                const seconds = parseInt(match[2]) * 60 + parseInt(match[3]);            
                pack.extractionProgress = seconds;
            }
        }

        if (pack.status && pack.status.includes('Extraction error')) {
            this.fileService.unrar(pack.name).then(extraction => {
                if (extraction) {
                    this.fileService.moveVideos([pack]);
                }
            });

        }
        return pack;
        
    }

    async addLinks(linkId: string, packageName: string): Promise<jdInit> {
        const response = await this.initiate();
        if (response.success) {
            let packageExists = (await this.getPackages(false, null, false) as jdPackage[]) || [];
            if (packageExists && packageExists.length) {
                if (packageExists.find(x => x.name == packageName)) {
                    return {
                        success: false,
                        error: {
                            src: 'JD',
                            type: 'Package already exists'
                        }
                    }
                }
            }
            let links = await this.itiService.getLinks(linkId);
            let resp;
            try {
                const linksString = links.join(' ');
                resp = await jdApi.addLinks(linksString, this.deviceId, packageName);
                await this.logInfo(this.addLinks, `Added ${links.length} links under the name ${packageName}`);
                return { success: true};
            } catch (e) {
                await this.logError(this.addLinks, `Error adding links`, e.error);
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

