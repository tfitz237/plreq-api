import { Module, Global } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import ConfigurationService from '../shared/configuration/configuration.service';
import { SharedModule } from '../shared/shared.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from './auth.user.entity';
import { JwtStrategy } from './jwt.strategy';
@Global()
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
        TypeOrmModule.forFeature([User]),
    ],
    providers: [AuthService, JwtStrategy],
    controllers: [AuthController],
    exports: [JwtStrategy, AuthService],
})
export class AuthModule {}
