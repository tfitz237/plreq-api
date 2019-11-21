import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import Configuration from '../shared/configuration/configuration';
import { IUser } from '../models/user';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService, private readonly configuration: Configuration) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configuration.jwt.secret,
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
      return new Promise<IUser>(resolve => {
        jwt.verify(token, this.configuration.jwt.secret, async (err, decoded) => {
          resolve(await this.authService.validateUser(decoded) ? decoded : false);
        });
      });

    }
    catch (e) {
      console.log(e);
    }
  }
}