import { Injectable } from '@nestjs/common';
import * as jdApi from 'jdownloader-api';
import * as fs from 'fs';
@Injectable()
export class JdService {
    isConnected: boolean = false;
    deviceId: string;
    links: jdLink[] = [];
    get isInitiated() : boolean { return this.isConnected && !!this.deviceId };

    async connect(): Promise<jdConnectResponse> {
        let file;
        try {
            file = fs.readFileSync('credentials.json', 'utf8');
        } catch (e) {
            return Promise.resolve({ connected: false, error: { src: 'fs', type: e}});
        }
        const creds = JSON.parse(file);
        try {
            const response = await jdApi.connect(creds.jd.email, creds.jd.password);
            if (response === true) {   
                this.isConnected = true;                         
                return {
                    connected: true
                };
            } else {
                return {
                    connected: false,
                    error: response.error
                };
            }
        }
        catch (response) {
            return {
                connected: false,
                error: JSON.parse(response.error)
            }
        }
    }

    async initiate(): Promise<jdInit> {
        if (this.isInitiated) {
            return {
                id: this.deviceId,
                success: true,
            };
        }
        const response = !this.isConnected ? await this.connect() : {connected: true};
        
        if (!response.connected) {
            return {
                success: false,
                error: response.error
            }
        }
        const deviceId = await this.listDevices();
        if (deviceId) {
            return {
                id: deviceId,
                success: true,
                error: null
            };
        } else {
            return {
                id: null,
                success: true,
                error: {
                    src: "API",
                    type: "NO_DEVICES_FOUND"
                }
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

    async getPackages(cached: boolean = false, uuids: string = null): Promise<jdPackage[]|jdInit> {
        const response = await this.initiate();
        if (response.success) {
            var packages;
            if (uuids) {
                packages = uuids;
            }
            if (cached && this.links.length > 0) {
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
                    return pck.data;
                } catch {}
            }

            return {
                success: false,
                error: {
                    src: 'api',
                    type: 'UUIDs not found'
                }
            };
        } else {
            return response;
        }
    }

    async addLinks(links: string[], autoStart: boolean = true): Promise<jdInit> {
        const response = await this.initiate();
        if (response.success) {
            const linksString = links.join(',');
            let resp;
            try {
                resp = await jdApi.addLinks(linksString, this.deviceId, autoStart);
                return { success: true};
            } catch (e) {
                return {
                    success: false,
                    error: e.error
                }
            }
        } else {
            return response;
        }
    }

}

export interface jdConnectResponse {
    connected: boolean;
    error?: Error
}

export interface jdInit {
    id?: string,
    success: boolean;
    error?: Error
}

export interface Error {
    src: string;
    type: string;
}

export interface jdLink {
    name: string,
    packageUUID: number,
    uuid: number
}

export interface jdPackage {
    bytesLoaded: number;
    name: string;
    finished: boolean;
    uuid: number;
    enabled: true;
    status: string;
}