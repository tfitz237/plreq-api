import { HttpException, Injectable, Inject } from '@nestjs/common';
import * as jdApi from 'jdownloader-api';
import { resolve } from 'url';
import { CronService } from '../cron/cron.service';
import { ItiService } from '../iti/iti.service';
import { JdConnectResponse, JdInit, JdLink, JdPackage } from '../models/jdownloader';
import ConfigurationService from '../shared/configuration/configuration.service';
import { JSONtryParse } from '../shared/functions';
import { LogLevel } from '../shared/log/log.entry.entity';
import { Logger } from '../shared/log/log.service';
import { WsGateway } from '../ws/ws.gateway';
import FileService from './file.service';
import { UserLevel } from '../shared/constants';
import { IConfiguration } from '../models/config';
@Injectable()
export class JdService {

    get isInitiated(): boolean { return this.isConnected && !!this.deviceId; }

    private get finishedPackages() {
        return this.packages.filter(pack => pack.finished && pack.status && pack.status.includes('Extraction OK'));
    }

    private get extractionErrorPackages() {
        return this.packages.filter(pack => pack.finished && pack.status && pack.status.includes('Extraction Error'));
    }

    isConnected: boolean = false;
    deviceId: string;
    links: JdLink[] = [];
    packages: JdPackage[] = [];
    cronId: number;
    moveCronId: number;
    private socket: WsGateway;
    constructor(private readonly fileService: FileService,
                @Inject('Configuration')
                private readonly config: IConfiguration,
                private readonly logService: Logger,
                private readonly itiService: ItiService,
                private readonly cronService: CronService) {
    }

    setSocket(socket: WsGateway) {
        this.socket = socket;
        this.initiate();
    }

    async initiate(): Promise<JdInit> {
        if (this.isInitiated) {
            return {
                id: this.deviceId,
                success: true,
                packages: this.packages,
            };
        }
        const response = !this.isConnected ? await this.connect() : {connected: true};

        if (!response.connected) {
            this.logService.logError('initiate', 'Could not connect to Jdownloader', response.error);
            throw new HttpException({
                success: false,
                error: response.error,
            }, 400);
        }
        const deviceId = await this.listDevices();
        if (deviceId) {
            const packages = (await this.getPackages()) as JdPackage[];
            await this.movePackages();
            if (this.cronId === undefined) {
                this.setupPollingCache();
            }
            await this.logService.logInfo('initiate', 'Initated connection with Jdownloader');
            return {
                id: deviceId,
                success: true,
                packages,
            };
        } else {
            this.logService.logError('initiate', 'No Jdownloader Devices found.');
            throw new HttpException({
                success: false,
                error: {
                    src: 'API',
                    type: 'NO_DEVICES_FOUND',
                },
            }, 400);
        }

    }

    async connect(): Promise<JdConnectResponse> {
        try {
            const response = await jdApi.connect(this.config.jd.email, this.config.jd.password);
            if (response === true) {
                this.isConnected = true;
                return {
                    connected: true,
                };
            } else {
                throw response;
            }
        }
        catch (response) {
            throw new HttpException({
                connected: false,
                error: (response.error && response.error.src) ? response.error : JSONtryParse(response.error),
            }, 400);
        }
    }

    async movePackages(): Promise<JdInit> {
        this.checkForUnrar();
        if (this.anyPackagesFinished(true)) {
            const [success, packages] =  await this.fileService.moveVideos(this.finishedPackages);
            const movedPackages = packages.filter(x => x.files.every(y => y && y.moved));
            await this.logService.logInfo('movePackages', `Moved videos: ${movedPackages.map(x =>
                    `${x.files.length} files: ${x.files.length > 0 ? x.files[0].fileName : 'No files moved'} to ${x.files.length > 0 ? x.files[0].destination : 'destination'}`,
            )}`);
            if (movedPackages.length > 0) {
                const cleaned = await this.cleanUp(movedPackages);
                return cleaned;
            }
            return {
                success,
            };

        }

        return {
            success: false,
        };
    }

    async cleanUp(finished: JdPackage[] = this.finishedPackages): Promise<JdInit> {
        try {
            await this.logService.logInfo('cleanUp', `Cleaning up ${finished.length} packages named: ${finished.map(x => x.name).join(', ')}`);
            let result = await jdApi.cleanUp(this.deviceId, finished.map(x => x.uuid));
            const packages = await this.getPackages(false, null, false) as JdPackage[];
            if (packages.length === 0) {
                result = result && this.fileService.cleanUp();
            }
            if (result) {
                return {
                    success: true,
                };
            }
        } catch (e) {
            console.error(e);
            return {
                success: false,
            };
        }
    }

    async removePackage(pkg: JdPackage): Promise<JdInit> {
        try {
            await this.logService.logInfo('removePackage', `Removing download package named: ${pkg.name}`);
            const result = await jdApi.cleanUp(this.deviceId, [pkg.uuid], 'DELETE_ALL');
            const packages = await this.getPackages(false, null, false) as JdPackage[];
            return {
                success: packages ? packages.findIndex(x => x.uuid === pkg.uuid) === -1 : false,
            };
        } catch (e) {
            console.error(e);
            return {
                success: false,
            };
        }
    }

    async getPackages(cachedLinks: boolean = false, uuids: string = null, cachedPackages: boolean = true): Promise<JdPackage[]|JdPackage|JdInit> {
        if (cachedPackages && this.packages.length > 0) {
            return this.packages;
        }
        const response = await this.initiate();
        if (response.success) {
            let packages;
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
                        const pa = this.packages.find(x => x.uuid === p.uuid);
                        if (pa) {
                            Object.assign(pa, p);
                        } else {
                            this.packages.push(p);
                        }

                    });
                    this.packages.forEach((pac, idx) => {
                        const a = pck.data.findIndex(x => x.uuid === pac.uuid);
                        if (a === -1) {
                            this.packages.splice(idx, 1);
                        }
                    });
                    this.logService.logTrace('getPackages',
`${this.packages.length} total
${this.finishedPackages.length} finished
${this.extractionErrorPackages.length} extract error
`);
                    if (pck.data.length === 1) {
                        return pck.data[0];
                    }
                    return pck.data;
                } catch {}
            }
            await this.logService.logError('getPackages', `Error finding packages`, null);
            throw new HttpException({
                success: false,
                error: {
                    src: 'api',
                    type: 'UUIDs not found',
                },
            }, 400);

        } else {
            throw new HttpException(response, 400);
        }
    }

    async addLinks(linkId: string, packageName: string): Promise<JdInit> {
        const response = await this.initiate();
        if (response.success) {
            const packageExists = (await this.getPackages(false, null, false) as JdPackage[]) || [];
            if (packageExists && packageExists.length) {
                if (packageExists.find(x => x.name === packageName)) {
                    return {
                        success: false,
                        error: {
                            src: 'JD',
                            type: 'Package already exists',
                        },
                    };
                }
            }
            const links = await this.itiService.getLinks(linkId);
            let resp;
            try {
                const linksString = links.join(' ');
                resp = await jdApi.addLinks(linksString, this.deviceId, packageName);
                await this.logService.logInfo('addLinks', `Added ${links.length} links under the name ${packageName}`);
                return { success: true};
            } catch (e) {
                await this.logService.logError('addLinks', `Error adding links`, e.error);
                throw new HttpException({
                    success: false,
                    error: e.error,
                }, 400);
            }
        } else {
            throw new HttpException(response, 400);
        }
    }

    async cronJob() {
        await this.getPackages(false, null, false);
        if (this.socket) {
            this.socket.sendEvent('packages', this.packages, UserLevel.User);
        }
    }

    private setupPollingCache() {
        this.cronId = this.cronService.setup({
            jobName: 'jd:get-packages',
            description: 'Cache JDownloader packages and emit packages to socket',
            interval: '*/2 * * * * *',
            onTick: {
                service: this,
                methodName: 'cronJob',
                parameters: [],
            },
        });
        this.moveCronId = this.cronService.setup({
            jobName: 'jd:move-packages',
            description: 'Move Finished JDownloader Packages to given directory',
            interval: '0 * * * * *',
            onTick: {
                service: this,
                methodName: 'movePackages',
                parameters: [],
            },
        });
    }

    private anyPackagesFinished(stopOnExtracted: boolean): boolean {
        if (this.finishedPackages.length > 0) {
            if (stopOnExtracted) {
                const extracting = this.packages.filter(pack => pack.status && pack.status.includes('Extracting'));
                return extracting.length === 0;
            }
            return true;
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

    private async getLinks(): Promise<JdLink[]> {
        const response = await this.initiate();
        if (response.success) {
            try {
                const links = await jdApi.queryLinks(this.deviceId);
                this.links = links.data;
                return links.data;
            }
            catch (e) {

                await this.logService.logError('getLinks', 'Could not retrieve links', e);
            }
        }
        return [];
    }

    private async checkForUnrar() {
        return new Promise<boolean>(async (res) => {
            for (let i = 0; i < this.packages.length; i++) {
                const pack = this.packages[i];
                if (!pack.forceExtraction && pack.status && pack.status.includes('Extraction error')) {
                    pack.forceExtraction = true;
                    pack.status = 'Forcing Extraction...';
                    Object.assign(this.packages[i], pack);
                    res(true);
                    const extraction = await this.fileService.unrar(pack);
                    if (extraction) {
                        pack.forceExtraction = false;
                        await this.fileService.moveVideos([pack]);
                        await this.removePackage(pack);
                    }

                }
            }
        });
    }

    private addPackageDetails(pack: JdPackage) {
        try {
            pack.progressPercent = Math.round(pack.bytesLoaded / pack.bytesTotal * 10000) / 100;
            pack.speedInMb = Math.round(pack.speed / 10000) / 100;
            const fullSeconds = (pack.bytesTotal - pack.bytesLoaded) / (pack.speed || 1);
            const minutes = fullSeconds / 60;
            const seconds = Math.floor(minutes) - Math.round(Math.floor(minutes) * 100) / 100 / 60;
            pack.progress = {
                percent: pack.progressPercent + '%',
                eta: Math.floor(minutes) + 'm' + Math.floor(seconds) + 's',
                speedInMb: isNaN(pack.speedInMb) ? '0' : pack.speedInMb + 'mb/s',
            };

            if (pack.status && pack.status.includes('Extracting')) {
                pack.extracting = true;
                const match = pack.status.match(/Extracting \(ETA: ((\d+)?m?:?(\d+)s)\).*/);
                if (match) {
                    pack.progress.extraction = match[1];
                    const secs = parseInt(match[2]) * 60 + parseInt(match[3]);
                    pack.extractionProgress = secs;
                }
            }
            if (pack.forceExtraction && pack.status && pack.status.includes('Extraction Error')) {
                pack.status = 'Forcing Extraction...';
            }

            return pack;
        }
        catch (e) {
            this.logService.logError('addPackageDetails', 'error adding package details', e);
        }

    }

}
