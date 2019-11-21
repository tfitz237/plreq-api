import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { SharedModule } from '../shared/shared.module';
import Configuration from '../shared/configuration/configuration';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './auth.user.entity';
@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
            secretOrPrivateKey: new Configuration().jwt.secret,
            signOptions: {
                expiresIn: 7776000,
            },
        }),
        SharedModule,
        TypeOrmModule.forFeature([User]),
    ],
    providers: [AuthService, JwtStrategy],
    controllers: [AuthController],
    exports: [JwtStrategy, AuthService],
})
export class AuthModule {}
