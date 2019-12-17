import { Test, TestingModule } from '@nestjs/testing';
import { CronController } from './cron.controller';
import { CronService } from './cron.service';
import { RolesGuard } from '../auth/auth.roles';

describe('Cron Controller', () => {
  let controller: CronController;
  let job = { id: 0 };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CronController],
      providers: [{provide: CronService, useValue: {
        getJobsSerializable: () => [job],
        getJob: (id) => job,
        startJob: (id) => true,
        stopJob: (id) => false,
      }}],
    }).overrideGuard(RolesGuard).useValue({canActivate: () => true}).compile();

    controller = module.get<CronController>(CronController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return a list of jobs', () => {
    const result = controller.getJobs();
    expect(result.length).toBe(1);
  });
  it('should return a job by id ', () => {
    const result = controller.getJob(0);
    expect(result.id).toBe(0);
  });
  it('should start a job by id ', () => {
    const result = controller.startJob(0);
    expect(result).toBe(true);
  });
  it('should stop a job by id ', () => {
    const result = controller.stopJob(0);
    expect(result).toBe(false);
  });
});
