import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  constructor() {}

  @Get()
  root(): any {
    return {
      version: '0.0.1',
    };
  }
}
