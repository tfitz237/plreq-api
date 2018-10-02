import { Test, TestingModule } from '@nestjs/testing';
import { JdService } from './jd.service';

describe('JdService', () => {
  let service: JdService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JdService],
    }).compile();
    service = module.get<JdService>(JdService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
