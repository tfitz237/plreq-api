import { CronJob as Job } from 'cron';

export interface CronJob {
    id: number;
    name: string;
    description: string;
    job: Job;
}