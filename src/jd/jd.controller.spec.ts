import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from '../auth/auth.roles';
import { IConfiguration, JdPackage, IUser} from '../models';
import { JdController } from './jd.controller';
import { JdService } from './jd.service';

describe('Jd Controller', () => {
  let module: TestingModule;
  let ctl: JdController;
  let svc: JdService;
  const config: IConfiguration = {
    jd: {
      email: 'test@test.com',
      password: 'test@test.com',
    },
    jwt: {
      secret: 'test',
    },
    filePaths: {
      dir: 'testDir',
      tvDestination: 'testTv',
      movieDestination: 'testMovie',
    },
    users: [{
      userGuid: 'guid',
      level: 4,
      username: 'testuser',
      password: 'unhashedpassword',
    }],
    tmdb: {
      apiKey: '',
    },
    plex: {
      dbLocation: '',
    },
    iti: {
      host: '',
      user: '',
      pass: '',
    },
  };
  const expected = {
    bytesLoaded: 0,
    name: 'name',
    finished: true,
    uuid: 1234,
    enabled: true,
    status: 'finished',
    progressPercent: 1,
    speedInMb: 1,
    speed: 1000,
    bytesTotal: 1000,
    progress: {
        percent: '1%',
        eta: '1m2s',
        speedInMb: '1mb/s',
    },
  };

  const mockService = {
    getPackages: (): any => expected,
    addLinks: () => expected,
    cleanUp: () => expected,
  };
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [JdController],
      providers: [{provide: JdService, useValue: mockService}],
    }).overrideGuard(RolesGuard).useValue({canActivate: () => true}).compile();
    ctl = module.get<JdController>(JdController);
    svc = module.get<JdService>(JdService);
  });
  beforeEach(async () => {
    mockService.getPackages = (): any => expected;
    mockService.addLinks = (): any => expected;
    mockService.cleanUp = (): any => expected;
  });
  it('should be defined', () => {
    expect(ctl).toBeDefined();
  });

  it('should return packages', async () => {
    const array = [expected, expected];
    mockService.getPackages = () => array;
    const result = await ctl.packages() as JdPackage[];
    expect(result).toBe(array);
    expect(result.length).toEqual(2);
  });

  it('should return a single package', async () => {
    const result: JdPackage = await ctl.package('uuid') as JdPackage;
    expect(result).toBe(expected);
  });

  it('should addLinks successfully', async () => {
    const result = await ctl.addLinks(['links']);
    expect(result).toBe(expected);
  });

  it('should cleanUp successfully', async () => {
    const result = await ctl.cleanUp();
    expect(result).toBe(expected);
  });
});
