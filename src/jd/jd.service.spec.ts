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
});
