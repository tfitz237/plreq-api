import { Error } from './status';
import { File} from '../jd/file.service';
export interface JdConnectResponse {
    connected: boolean;
    error?: Error;
}
export interface JdInit {
    id?: string;
    success: boolean;
    error?: Error;
    packages?: JdPackage[];
}

export interface JdLink {
    name: string;
    packageUUID: number;
    uuid: number;
}
export interface JdPackage {
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
    };
    files: File[];
}