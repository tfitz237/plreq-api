import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as helmet from 'helmet';
import * as fs from 'fs';
declare const module: any;
async function bootstrap() {
  const httpsOptions = {
    //key: fs.readFileSync('./secrets/private-key.pem'),
    //cert: fs.readFileSync('./secrets/public-certificate.pem')
  };

  const app = await NestFactory.create(AppModule); //,{ httpsOptions,});
  app.enableCors();
  app.use(helmet());
  await app.listen(32465);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
