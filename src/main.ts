import { NestFactory } from '@nestjs/core';
import * as fs from 'fs';
import * as helmet from 'helmet';
import { AppModule } from './app.module';
async function bootstrap() {
  const httpsOptions = {
    // key: fs.readFileSync('./secrets/private-key.pem'),
    // cert: fs.readFileSync('./secrets/public-certificate.pem')
  };

  const app = await NestFactory.create(AppModule); // ,{ httpsOptions,});
  app.enableCors();
  app.use(helmet());
  await app.listen(32465);
}
bootstrap();
