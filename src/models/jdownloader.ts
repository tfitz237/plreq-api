import { Error } from './status';

export interface jdConnectResponse {
    connected: boolean;
    error?: Error;
}
export interface jdInit {
    id?: string;
    success: boolean;
    error?: Error;
}

export interface jdLink {
    name: string;
    packageUUID: number;
    uuid: number;
}
export interface jdPackage {
    bytesLoaded: number;
    name: string;
    finished: boolean;
    uuid: number;
    enabled: true;
    status: string;
    progressPercent: number;
    speedInMb: number;
    speed: number;
    bytesTotal: number;
    progress: {
        percent: string;
        eta: string;
        speedInMb: string;
    }
}