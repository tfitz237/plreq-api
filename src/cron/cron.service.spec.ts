import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '../shared/log/log.service';
import { CronService } from './cron.service';
import { CronSetup, CronJob } from '../models/cronjob';

describe('CronService', () => {
  let service: CronService;


  jest.useFakeTimers();
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CronService, {provide: Logger, useValue: { log: () => null}}],
    }).compile();

    service = module.get<CronService>(CronService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('start/stop()', () => {
    const start = jest.fn();
    const stop = jest.fn();
    const job = { job: { start, stop }};
    beforeEach(() => {
      (service as any).jobs = [job];
    });

    it ('starts the job', () => {
      service.startJob(0);
      expect(start).toBeCalled();
    });

    it ('stops the job', () => {
      service.stopJob(0);
      expect(stop).toBeCalled();
    });
  });

  describe('getJob/findJob()', () => {
    const jobs = [
      {
        id: 0,
        name: 'test',
      },
      {
        id: 1,
        name: 'test2',
      },
    ];
    beforeEach(() => {
      (service as any).jobs = jobs;
    });

    it ('gets job by id', () => {
      let job = service.getJob(0);
      expect(job.name).toBe(jobs[0].name);
      job = service.getJob(1);
      expect(job.name).toBe(jobs[1].name);
    });
    it ('returns undefined if id does not exist', () => {
      const job = service.getJob(2);
      expect(job).toBe(undefined);
    });
    it ('finds job by name', () => {
      let job = service.findJob('test');
      expect(job.id).toBe(jobs[0].id);
      job = service.findJob('test2');
      expect(job.id).toBe(jobs[1].id);
    });
  });

  describe('setup()', () => {

    let cronSetup: CronSetup;
    beforeEach(() => {
      (service as any).jobs = [];
      cronSetup = {
        jobName: 'test',
        interval: '* * * * * *',
        onTick: { service: { test: () => null}, methodName: 'test', parameters: []},
        autoStart: false,
      };
    });

    it('should return an id', () => {
      const id = service.setup(cronSetup);
      expect(id).toBe(0);
    });
    it('should not return an id if the method does not exist', () => {
      cronSetup.onTick.service = {};
      const id = service.setup(cronSetup);
      expect(id).toBe(null);
    });
    it('should run the given job, and stop the given job', () => {
      let i = 0;
      const fn = jest.fn(() => i++);
      cronSetup.onTick.service.test = fn;
      const id = service.setup(cronSetup);
      expect((service as any).jobs.length).toBe(1);
      expect(id).toBe(0);
      jest.advanceTimersByTime(3000);
      setTimeout(() => {
        service.stopJob(id);
        expect(i).toBeGreaterThan(2);
        i = -999;
        expect(fn).toBeCalled();
        setTimeout(() => {
          expect(i).toBe(-999);
        }, 5000);
      }, 3000);
    });
  });

  describe('toSerializable', () => {
    const cronSetup = {
      jobName: 'test',
      interval: '* * * * * *',
      onTick: { service: { test: () => null}, methodName: 'test', parameters: []},
      autoStart: false,
    };
    let job: CronJob;

    beforeEach(() => {
      (service as any).jobs = [];
      job = service.getJob(service.setup(cronSetup));
      expect(job).toBeTruthy();
    });

    it('returns a serialized job', () => {
      const result = (service as any).toSerializable(job);
      expect(result.name).toBe(job.name);
      expect(result.job.cronTime).toBe(cronSetup.interval);
      expect(result.id).toBe(0);
      expect(result.job.lastDate).toBe(null);
      expect(result.job.running).toEqual(cronSetup.autoStart || undefined);
    });

    it('should fail to return a job', () => {
      job.name = null;
      let result = (service as any).toSerializable(job);
      expect(result).toBe(null);
      job.name = 'test';
      result = (service as any).toSerializable(job);
      expect(result.name).toBe(job.name);
      job.job = null;
      result = (service as any).toSerializable(job);
      expect(result).toBe(null);
    })
  });
});
