import { Test, TestingModule } from '@nestjs/testing';
import { JdController } from './jd.controller';
import Configuration from '../shared/configuration';
import {iConfiguration} from '../models/config';
import { iUser } from '../models/user';
import { JdService } from './jd.service';
import FileService from './file.service';
import { jdPackage } from '../models/jdownloader';

describe('Jd Controller', () => {
  let module: TestingModule;
  let ctl: JdController;
  let svc: JdService;
  const config: iConfiguration = {
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
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [JdController],
      providers: [FileService, {provide: Configuration, useValue: config}, JdService],
    }).compile();
    ctl = module.get<JdController>(JdController);
    svc = module.get<JdService>(JdService);
  });

  it('should be defined', () => {
    expect(ctl).toBeDefined();
  });

  it('should return packages', async () => {
    const expected: jdPackage[] = [{
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
    }, {
      bytesLoaded: 0,
      name: 'name2',
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
      }}];
    jest.spyOn(svc, 'getPackages').mockImplementation( () => expected);
    const result = await ctl.packages() as jdPackage[];
    expect(result).toBe(expected);
    expect(result.length).toEqual(2);
  });

  it('should return a single package', async () => {
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
    jest.spyOn(svc, 'getPackages').mockImplementation( () => expected);
    const result: jdPackage = await ctl.package('uuid') as jdPackage;
    expect(result).toBe(expected);
  });

  it('should addLinks successfully', async () => {
    const expected = {
      success: true,
    };
    jest.spyOn(svc, 'addLinks').mockImplementation( () => expected);
    const result = await ctl.addLinks(['links']);
    expect(result).toBe(expected);
  });

  it('should cleanUp successfully', async () => {
    const expected = {
      success: true,
    };
    jest.spyOn(svc, 'cleanUp').mockImplementation( () => expected);
    const result = await ctl.cleanUp();
    expect(result).toBe(expected);
  });
});
