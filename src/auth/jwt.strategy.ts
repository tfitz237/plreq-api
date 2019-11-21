import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { IUser } from '../models/user';
import * as jwt from 'jsonwebtoken';
import ConfigurationService from '../shared/configuration/configuration.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService, private readonly configService: ConfigurationService) {
    super( {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'test',
    });
  }

  async validate(payload: IUser) {
    const user = await this.authService.validateUser(payload);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  async verifyJwt(token: string): Promise<IUser|boolean> {
    try {
      const config = await this.configService.getConfig();
      return new Promise<IUser>(resolve => {
        jwt.verify(token, config.jwt.secret, async (err, decoded) => {
          resolve(await this.authService.validateUser(decoded) ? decoded : false);
        });
      });

    }
    catch (e) {
      console.log(e);
    }
  }
}