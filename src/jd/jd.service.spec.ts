import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as jdApi from 'jdownloader-api';
import { CronService } from '../cron/cron.service';
import { ItiService } from '../iti/iti.service';
import { IConfiguration } from '../models/config';
import ConfigurationService from '../shared/configuration/configuration.service';
import { Logger } from '../shared/log/log.service';
import FileService from './file.service';
import { JdService } from './jd.service';
jest.mock('jdownloader-api');
describe('JdService', () => {
  let service: JdService;
  const moveVideos = async (pkgs) => Promise.resolve([true, pkgs]);

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
    iti: {
      host: 'test',
      user: 'test',
      pass: 'test',
    },
    plex: {
      dbLocation: 'test',
    },
    tmdb: {
      apiKey: 'test',
    },
  };

  const devices = [{
    id: '1',
    name: 'jdownloader',
  }];
  const packages = [{
    bytesLoaded: 0,
    name: 'name',
    finished: true,
    uuid: 1234,
    enabled: true,
    status: 'Extraction OK',
    progressPercent: 1,
    speedInMb: 1,
    speed: 1000,
    bytesTotal: 1000,
    progress: {
        percent: '1%',
        eta: '1m2s',
        speedInMb: '1mb/s',
    },
    files: [],
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
    },
    files: [],
  }];
  let module: TestingModule;
  beforeAll(async () => {

    module = await Test.createTestingModule({
      providers: [
        JdService,
        {provide: ConfigurationService, useValue: {
          getConfig: () => config,
        }},
        {provide: FileService, useValue: { moveVideos }},
        {provide: ItiService, useValue: {}},
        {provide: Logger, useValue: {
          log: (a, b, c, d, e) => {},
        }},
        {provide: CronService, useValue: {setup: () => 1}},
      ],
    }).compile();
    service = module.get<JdService>(JdService);
  });

  beforeEach( () => {
    service = module.get<JdService>(JdService);
    service.isConnected = false;
    service.deviceId = undefined;
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe( 'connect()', () => {
    it('should connect successfully', async () => {
      const expected = {
        connected: true,
      };
      jdApi.connect.mockImplementation((email, pass) => {
        expect(email).toBe(config.jd.email);
        expect(pass).toBe(config.jd.password);
        return true;
      });

      const result = await service.connect();
      expect(result).toEqual(expected);
      expect(service.isConnected).toEqual(true);
    });

    it('should throw when not connected successfully (no catch)', async () => {
      const expected = new HttpException({
        connected: false,
        error: '{"src":"test","type": "test"}',
      }, 400);
      jdApi.connect.mockImplementation((email, pass) => {
        return {error: '{"src":"test","type": "test"}'};
      });
      const result = service.connect();
      expect(result).rejects.toBeInstanceOf(HttpException);
      expect(result).rejects.toHaveProperty('message.connected', false);
    });

    it('should throw when not connected successfully (with catch)', async () => {
      jdApi.connect.mockImplementation((email, pass) => {
        throw {
          connected: false,
          error: '{"src":"test","type": "test"}',
        };
      });
      const result = service.connect();
      expect(result).rejects.toBeInstanceOf(HttpException);
    });
  });

  it('should return initiated when connected and deviceId is set', () => {
    service.deviceId = 'id';
    service.isConnected = true;
    const result = service.isInitiated;
    expect(result).toEqual(true);
  });

  describe( 'movePackages', () => {
    it('should find finished pacakges but fail to move them', async () => {
      packages[0].files[0] = { moved: false };
      packages[1].files[0] = { moved: false };
      service.packages = packages;
      const cleanedUp = jest.spyOn(service, 'cleanUp');
      const result = await service.movePackages();
      expect(cleanedUp).not.toBeCalled();
    });
    it('should find finished packages and move them and clean up', async () => {
      packages[0].files[0] = { moved: true };
      packages[1].files[0] = { moved: true };
      service.packages = packages;
      const cleanedUp = jest.spyOn(service, 'cleanUp').mockImplementation(() => Promise.resolve({success: true}));
      const result = await service.movePackages();
      expect(result).toHaveProperty('success', true);
      expect(cleanedUp).toBeCalled();
    });

  });

  describe( 'initiate()', () => {
    beforeEach( () => {
      service.cronId = undefined;
    });
    it('should return cached values if exists on initiate', async () => {
      service.isConnected = true;
      service.packages = packages as any;
      service.deviceId = devices[0].id;
      expect(service.isInitiated).toEqual(true);

      const connect = jest.spyOn(service, 'connect');
      const result = await service.initiate();
      expect(connect).not.toHaveBeenCalled();
      expect(result.success).toEqual(true);
      expect(result.id).toBe(devices[0].id);
      expect(result.packages[0]).toBe(packages[0]);
    });
    it('should initiate the jdService successfully', async () => {
      service.cronId = 1;
      const connect = jest.spyOn(service, 'connect').mockResolvedValue({ connected: true});
      const getPackages = jest.spyOn(service, 'getPackages').mockResolvedValue(packages as any);
      const movePackages = jest.spyOn(service, 'movePackages').mockImplementation();
      const listDevices = jest.spyOn(service as any, 'listDevices').mockResolvedValue(devices[0].id);
      const result = await service.initiate();
      expect(connect).toBeCalled();
      expect(listDevices).toBeCalled();
      expect(getPackages).toBeCalled();
      expect(movePackages).toBeCalled();
      expect(result.success).toEqual(true);
      expect(result.id).toBe(devices[0].id);
      expect(result.packages[0]).toBe(packages[0]);
    });

    it('should throw if connected fails', async () => {
      const connect = jest.spyOn(service, 'connect').mockResolvedValue({ connected: false, error: {src: 'test', type: 'test'}});
      const result = service.initiate();
      expect(connect).toBeCalled();
      expect(result).rejects.toBeInstanceOf(HttpException);
    });

    it('should throw if deviceId not returned', async () => {
      const connect = jest.spyOn(service, 'connect').mockResolvedValue({ connected: true});
      const listDevices = jest.spyOn(service as any, 'listDevices').mockResolvedValue(null);
      const result = service.initiate();
      expect(connect).toBeCalled();
      expect(listDevices).toBeCalled();
      expect(result).rejects.toBeInstanceOf(HttpException);
    });

    it('should initiate polling', async () => {
      const connect = jest.spyOn(service, 'connect').mockResolvedValue({ connected: true});
      const getPackages = jest.spyOn(service, 'getPackages').mockResolvedValue(packages);
      const movePackages = jest.spyOn(service, 'movePackages').mockResolvedValue({success:true});
      const listDevices = jest.spyOn(service as any, 'listDevices').mockImplementation(() => devices[0].id);
      const setupPollingCache = jest.spyOn(service as any, 'setupPollingCache').mockImplementation();
      const result = await service.initiate();
      expect(connect).toBeCalled();
      expect(listDevices).toBeCalled();
      expect(getPackages).toBeCalled();
      expect(movePackages).toBeCalled();
      expect(setupPollingCache).toHaveBeenCalled();
    });
  });
});
