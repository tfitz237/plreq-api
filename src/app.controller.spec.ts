import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { RolesGuard } from './auth/auth.roles';

describe('AppController', () => {
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
    }).overrideGuard(RolesGuard).useValue({canActivate: () => true}).compile();
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      const appController = app.get<AppController>(AppController);
      expect(appController.root()).toEqual({version: '1.2.1'});
    });
  });
});
