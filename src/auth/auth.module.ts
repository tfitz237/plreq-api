import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import Credentials from '../shared/credentials';
@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }), 
        JwtModule.register({
            secretOrPrivateKey: new Credentials().jwt.secret,
            signOptions: {
                expiresIn: 3600,
            },
        })
    ],
    providers: [AuthService, JwtStrategy],
    controllers: [AuthController],
})
export class AuthModule {}
