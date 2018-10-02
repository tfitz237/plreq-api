import { Injectable } from '@nestjs/common';
import * as jdApi from 'jdownloader-api';
import * as fs from 'fs';
@Injectable()
export class JdService {
    isConnected: boolean = false;
    deviceId: string;
    links: jdLink[] = [];
    get isInitiated() : boolean { return this.isConnected && !!this.deviceId };

    connect(): Promise<jdConnectResponse> {
        let file;
        try {
            file = fs.readFileSync('jd.credentials.json', 'utf8');
        } catch (e) {
            return new Promise(resolve => resolve({ connected: false, error: { src: 'fs', type: e}}));
        }
        var creds = JSON.parse(file);
        return jdApi.connect(creds.email, creds.password)
                    .then(response => {
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
                    }).catch(response=> {
                        return {
                            connected: false,
                            error: JSON.parse(response.error)
                        }
                    });
    }

    initiate(): Promise<jdInit> {
        if (this.isInitiated) {
            return new Promise((resolve) => resolve({
                id: null,
                success: true,
                error: null
            }));
        }
        if (!this.isConnected) {
            return this.connect().then(response => {
                if (response.connected) {
                    return this.listDevices().then(deviceId => {
                        if (deviceId) {
                            return {
                                id: deviceId,
                                success: true,
                                error: null
                            }
                        } else {
                            return {
                                id: null,
                                success: true,
                                error: {
                                    src: "API",
                                    type: "NO_DEVICES_FOUND"
                                }
                            }
                        }
                    });
                } else {
                    return {
                        success: false,
                        id: null,
                        error: response.error
                    }
                }
            })
        } else {
            return this.listDevices().then(deviceId => {
                if (!deviceId) {
                    return {
                        id: deviceId,
                        success: true,
                        error: null
                    }
                }
            });
        }
    }

    listDevices(): Promise<string> {
        if (!this.deviceId) {
            return jdApi.listDevices().then(devices => {
                if (devices.length > 0) {
                    this.deviceId = devices[0].id;
                    return devices[0].id;
                }
                return null;
            }).catch(err => {
                return null;
            })
        }

    }

    getLinks(): Promise<jdLink[]> {
        return this.initiate().then(response => {
            if (response.success) {
                return jdApi.queryLinks(this.deviceId).then(links => {
                    this.links = links.data;
                    return links.data;
                });
            }
        });
    }
    getPackages(cached: boolean = false, uuids: string = null): Promise<jdPackage[]|jdInit> {
        return this.initiate().then(response => {
            if (response.success) {
                var packages;
                if (uuids) {
                    packages = uuids;
                }
                if (cached && this.links.length > 0) {
                    packages = Array.from(new Set(this.links.map(link => link.packageUUID)));
                }
                if (packages) {
                    return jdApi.queryPackages(this.deviceId, packages).then(pck => {
                        return pck.data
                    });
                }

                return this.getLinks().then(links => {
                    var packageUUIDs = Array.from(new Set(this.links.map(link => link.packageUUID)));

                    return jdApi.queryPackages(this.deviceId, packageUUIDs).then(packages => {
                        return packages.data
                    });
                })
            } else {
                return response;
            }
        })
    }

}

export interface jdConnectResponse {
    connected: boolean;
    error: Error
}

export interface jdInit {
    id: string,
    success: boolean;
    error: Error
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