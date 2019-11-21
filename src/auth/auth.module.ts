import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { SharedModule } from '../shared/shared.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './auth.user.entity';
import ConfigurationService from '../shared/configuration/configuration.service';
@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [SharedModule],
            useFactory: async (config: ConfigurationService) => ({
                secretOrPrivateKey: (await config.getConfig()).jwt.secret,
                signOptions: {
                    expiresIn: 7776000,
                },
            }),
            inject: [ConfigurationService],
        }),
        SharedModule,
        TypeOrmModule.forFeature([User]),
    ],
    providers: [AuthService, JwtStrategy],
    controllers: [AuthController],
    exports: [JwtStrategy, AuthService],
})
export class AuthModule {}
