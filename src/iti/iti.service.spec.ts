import { Test, TestingModule } from '@nestjs/testing';
import { ItiService } from './iti.service';

describe('ItiService', () => {
  let service: ItiService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ItiService],
    }).compile();
    service = module.get<ItiService>(ItiService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
