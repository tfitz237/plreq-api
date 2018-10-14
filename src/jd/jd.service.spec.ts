import { Test, TestingModule } from '@nestjs/testing';
import { JdService } from './jd.service';
import FileService from './file.service';
import Configuration from '../shared/configuration';
import { iConfiguration } from '../models/config';
import * as jdApi from 'jdownloader-api';
import { HttpException } from '@nestjs/common';
jest.mock('jdownloader-api');
describe('JdService', () => {
  let service: JdService;
  let fileService: FileService;
  const config: iConfiguration = {
    jd: {
      email: "test@test.com",
      password: "test@test.com"
    },
    jwt: {
      secret: "test"
    },
    filePaths: {
      dir: 'testDir',
      tvDestination: 'testTv',
      movieDestination: 'testMovie'
    },
    users: [{
      userGuid: 'guid',
      level: 4,
      username: 'testuser',
      password: 'unhashedpassword'
    }]
  };
  beforeAll(async () => {

    const module: TestingModule = await Test.createTestingModule({
      providers: [JdService, FileService, {provide: Configuration, useValue: config}],
    }).compile();
    service = module.get<JdService>(JdService);
    fileService = module.get<FileService>(FileService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  beforeEach( () => {
    service.isConnected = false;
    service.deviceId = undefined;
    service.pollPackages = false;
  })
  it('should connect successfully', async () => {
    const expected = {
      connected: true
    };
    jdApi.connect.mockImplementation((email, pass) => {
      expect(email).toBe(config.jd.email);
      expect(pass).toBe(config.jd.password);
      return true;
    })

    const result = await service.connect();
    expect(result).toEqual(expected);
    expect(service.isConnected).toEqual(true);
  });

  it('should throw when not connected successfully (no catch)', async () => {
    const expected = new HttpException({
      connected: false,
      error: '{"src":"test","type": "test"}'
    }, 400);
    jdApi.connect.mockImplementation((email, pass) => {
      return {error: '{"src":"test","type": "test"}'};
    });
    const result = service.connect()
    expect(result).rejects.toBeInstanceOf(HttpException);
    expect(result).rejects.toHaveProperty('message.connected', false);
  });
  it('should throw when not connected successfully (with catch)', async () => {
    jdApi.connect.mockImplementation((email, pass) => {
      throw {
        connected: false,
        error: '{"src":"test","type": "test"}'
      };
    });
    const result = service.connect()
    expect(result).rejects.toBeInstanceOf(HttpException);
  });

  it('should return initiated when connected and deviceId is set', () => {
    service.deviceId = 'id';
    service.isConnected = true;
    const result = service.isInitiated;
    expect(result).toEqual(true);
  });

  it('should initiate the jdService successfully', async () => {
    const devices = [{
      id: 1,
      name:'jdownloader'
    }];
    const packages = [{
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
          percent: "1%",
          eta: "1m2s",
          speedInMb: "1mb/s",
      }
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
          percent: "1%",
          eta: "1m2s",
          speedInMb: "1mb/s",
      }}];
    service.pollPackages = false;
    jest.spyOn(service, "connect").mockReturnValue({ connected: true});
    jest.spyOn(service, "getPackages").mockReturnValue(packages);
    jest.spyOn(service, "movePackages").mockImplementation();
    jdApi.listDevices.mockImplementation(() => devices);
    const result = await service.initiate();
    expect(result.success).toEqual(true);
    expect(result.id).toBe(devices[0].id);
    expect(result.packages[0]).toBe(packages[0]);
    

  });

  it('should return cached values if exists on initiate', async () => {
    const devices = [{
      id: '1',
      name:'jdownloader'
    }];
    const packages = [{
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
          percent: "1%",
          eta: "1m2s",
          speedInMb: "1mb/s",
      }
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
          percent: "1%",
          eta: "1m2s",
          speedInMb: "1mb/s",
      }}];
    service.isConnected = true;
    service.pollPackages = false;
    service.packages = packages;
    service.deviceId = devices[0].id;
    const result = await service.initiate();
    expect(result.success).toEqual(true);
    expect(result.id).toBe(devices[0].id);
    expect(result.packages[0]).toBe(packages[0]);
    

  });

  it('should throw if connected fails', async () => {
    jest.spyOn(service, "connect").mockReturnValue({ connected: false, error: '{"src": "test", "type": "test"}'});
    const result = service.initiate();
    expect(result).rejects.toBeInstanceOf(HttpException);
  });

  it('should throw if deviceId not returned', async () => {
    jest.spyOn(service, "connect").mockReturnValue({ connected: true});
    jdApi.listDevices.mockReturnValue([]);
    const result = service.initiate();
    expect(result).rejects.toBeInstanceOf(HttpException);
  });

  it('should initiate polling', async () => {
    const devices = [{
      id: 1,
      name:'jdownloader'
    }];
    const packages = [{
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
          percent: "1%",
          eta: "1m2s",
          speedInMb: "1mb/s",
      }
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
          percent: "1%",
          eta: "1m2s",
          speedInMb: "1mb/s",
      }}];
    jest.useFakeTimers();

    service.pollPackages = true;
    let movePackages = 0;
    let getPackages = 0;
    jest.spyOn(service, "connect").mockReturnValue({ connected: true});
    jest.spyOn(service, "getPackages").mockImplementation(() => {
      getPackages++;
      return packages});
    jest.spyOn(service, "movePackages").mockImplementation(() => movePackages++);
    jdApi.listDevices.mockImplementation(() => devices);
    const result = await service.initiate();
    expect(result.success).toEqual(true);
    expect(result.id).toBe(devices[0].id);
    expect(result.packages[0]).toBe(packages[0]);
    expect(service.pollPackages).toEqual(false);
    expect(setInterval).toBeCalledTimes(2);
    jest.advanceTimersByTime(2000);
    expect(getPackages).toEqual(2);
    jest.advanceTimersByTime(58000);
    expect(movePackages).toEqual(2);
  });

  it('should find finished pacakges and move them and clean up', async () => {
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
          percent: "1%",
          eta: "1m2s",
          speedInMb: "1mb/s",
      }
    }, {      
      bytesLoaded: 0,
      name: 'name2',
      finished: true,
      uuid: 1234,
      enabled: true,
      status: 'Finished',
      progressPercent: 1,
      speedInMb: 1,
      speed: 1000,
      bytesTotal: 1000,
      progress: {
          percent: "1%",
          eta: "1m2s",
          speedInMb: "1mb/s",
      }}];
    service.packages = packages;
    jest.spyOn(fileService, "moveVideos").mockResolvedValue([true, true]);
    const cleanedUp = jest.spyOn(service, "cleanUp");
    cleanedUp.mockImplementation(() => {
      return {
        success: true
      };
    });
    const result = await service.movePackages();
    expect(result).toHaveProperty('success', true);
    expect(cleanedUp).toBeCalled();
  });
  it('should find finished pacakges but fail to move them', async () => {
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
          percent: "1%",
          eta: "1m2s",
          speedInMb: "1mb/s",
      }
    }, {      
      bytesLoaded: 0,
      name: 'name2',
      finished: true,
      uuid: 1234,
      enabled: true,
      status: 'Finished',
      progressPercent: 1,
      speedInMb: 1,
      speed: 1000,
      bytesTotal: 1000,
      progress: {
          percent: "1%",
          eta: "1m2s",
          speedInMb: "1mb/s",
      }}];
    service.packages = packages;
    jest.spyOn(fileService, "moveVideos").mockReturnValue([true, false]);
    const cleanedUp = jest.spyOn(service, "cleanUp")
    
    const result = await service.movePackages();
    expect(cleanedUp).not.toBeCalled();
  });
});
