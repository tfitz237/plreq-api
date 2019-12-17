import { CronJob as Job } from 'cron';

export interface CronJob {
    id: number;
    name: string;
    description: string;
    job: Job;
}

export interface CronSetup {
    jobName: string;
    interval: string;
    onTick: CronFunction;
    onComplete?: CronFunction;
    description?: string;
    autoStart?: boolean;
}

export interface CronFunction {
    service: any;
    methodName: string;
    parameters: any[];
}