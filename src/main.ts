import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as helmet from 'helmet';
import * as fs from 'fs';
async function bootstrap() {
  const httpsOptions = {
    //key: fs.readFileSync('./secrets/private-key.pem'),
    //cert: fs.readFileSync('./secrets/public-certificate.pem')
  };

  const app = await NestFactory.create(AppModule); //,{ httpsOptions,});
  app.use(helmet());
  await app.listen(32465);
}
bootstrap();
