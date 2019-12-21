import { Get, Controller } from '@nestjs/common';

@Controller()
export class AppController {
  constructor() {}

  @Get()
  root(): any {
    return {
      version: '1.2.1',
    }
  }
}
