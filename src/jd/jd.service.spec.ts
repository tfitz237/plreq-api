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
      error: {src:'test',type: 'test'}
    }, 400);
    jdApi.connect.mockImplementation((email, pass) => {
      return {error: '{"src":"test","type": "test"}'};
    });
    const result = service.connect()
    expect(result).rejects.toBeInstanceOf(HttpException);
    expect(result).rejects.toHaveProperty('message.connected', false);
  });
  it('should throw when not connected successfully (with catch)', async () => {
    const expected = new HttpException({
      connected: false,
      error: {src:'test',type: 'test'}
    }, 400);
    jdApi.connect.mockImplementation((email, pass) => {
      throw expected;
    });
    const result = service.connect()
    expect(result).rejects.toBe(expected);
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
    

  })
});
