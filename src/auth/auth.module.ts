import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { HttpStrategy } from './http.strategy';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';

@Module({
    imports: [PassportModule.register({ defaultStrategy: 'bearer' }),],
    providers: [AuthService, HttpStrategy],
    controllers: [AuthController],
})
export class AuthModule {}
