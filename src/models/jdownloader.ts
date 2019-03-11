import { Error } from './status';
import { File} from '../jd/file.service';
export interface jdConnectResponse {
    connected: boolean;
    error?: Error;
}
export interface jdInit {
    id?: string;
    success: boolean;
    error?: Error;
    packages?: jdPackage[];
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
    enabled: boolean;
    status: string;
    progressPercent: number;
    speedInMb: number;
    speed: number;
    bytesTotal: number;
    extracting?: boolean;
    forceExtraction?: boolean;
    extractionProgress?: number;   
    progress: {
        percent: string;
        eta: string;
        extraction?: string;
        speedInMb: string;
    },
    files: File[]
}