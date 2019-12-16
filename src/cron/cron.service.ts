import { Injectable } from '@nestjs/common';
import { CronJob as Job } from 'cron';
import { CronJob } from '../models/cronjob';
import { Logger } from '../shared/log/log.service';

@Injectable()
export class CronService {
    private jobs: CronJob[] = [];
    constructor(private readonly logService: Logger) {
    }

    setup({ jobName, interval, onTick, onComplete, description, autoStart = true }: CronSetup): number {
        if (onTick &&
            onTick.service &&
            onTick.service[onTick.methodName] &&
            typeof onTick.service[onTick.methodName] === 'function') {
            const newJob: CronJob = {
                id: this.jobs.length,
                name: jobName,
                description,
                job:  new Job(
                    interval,
                    async () => {
                            this.logService.logTrace('setup', `CronJob: ${jobName} initiated. `);
                            await onTick.service[onTick.methodName](...onTick.parameters);
                    },
                    (onComplete && onComplete.service && onComplete.service[onComplete.methodName])
                        ? async () =>
                            {
                                this.logService.logTrace('setup', `CronJob: ${jobName} finished. `);
                                await onComplete.service[onComplete.methodName](...onComplete.parameters);
                            }
                        : null
                    ,
                    autoStart,
                    'America/New_York',
                  ),
            };
            this.jobs.push(newJob);
            return newJob.id;
        }
        return null;

    }

    getJob(id: number): CronJob {
        return this.jobs[id];
    }

    findJob(name: string): CronJob {
        return this.jobs.find(x => x.name === name);
    }

    startJob(id: number) {
        const cronJob = this.getJob(id);
        if (cronJob) {
            cronJob.job.start();
        }
    }

    stopJob(id: number) {
        const cronJob = this.getJob(id);
        if (cronJob) {
            cronJob.job.stop();
        }
    }
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
    service: object;
    methodName: string;
    parameters: any[];
}