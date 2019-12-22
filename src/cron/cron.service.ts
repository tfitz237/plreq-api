import { Injectable } from '@nestjs/common';
import { CronJob as Job } from 'cron';
import { CronJob, CronSetup } from '../models';
import { LogService } from '../shared/log/log.service';
import moment = require('moment-timezone');

@Injectable()
export class CronService {
    private jobs: CronJob[] = [];
    constructor(private readonly logService: LogService) {
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

    getJobsSerializable() {
        return this.jobs.map(this.toSerializable);
    }

    getJob(id: number): CronJob {
        return this.jobs[id];
    }

    getJobSerializable(id: number) {
        const job = this.jobs[id];
        if (job) {
            return this.toSerializable(job);
        }
        return null;
    }

    findJob(name: string): CronJob {
        return this.jobs.find(x => x.name === name);
    }

    startJob(id: number) {
        const cronJob = this.getJob(id);
        if (cronJob) {
            cronJob.job.start();
            return cronJob.job.running;
        }
        return false;
    }

    stopJob(id: number) {
        const cronJob = this.getJob(id);
        if (cronJob) {
            cronJob.job.stop();
            return !cronJob.job.running;
        }
        return true;
    }

    private toSerializable(x: CronJob) {
        const job = x.job as any;
        if (x && x.name && x.job) {
            return {
                name: x.name,
                id: x.id,
                description: x.description,
                job: {
                    nextDate: job.nextDate().tz(job.cronTime.zone).format(),
                    lastDate: job.lastDate() ? moment.tz(job.lastDate(), job.cronTime.zone).format() : null,
                    running: job.running,
                    cronTime: job.cronTime.source,
                },
            };
        }

        return null;
    }
}
