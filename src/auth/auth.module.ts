import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { SharedModule } from '../shared/shared.module';
import Configuration from '../shared/configuration';
@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }), 
        JwtModule.register({
            secretOrPrivateKey: new Configuration().jwt.secret,
            signOptions: {
                expiresIn: 172800,
            },
        }),
        SharedModule
    ],
    providers: [AuthService, JwtStrategy],
    controllers: [AuthController],
    exports: [JwtStrategy]
})
export class AuthModule {}
