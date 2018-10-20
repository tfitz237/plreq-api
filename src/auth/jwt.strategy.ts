import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import  Configuration  from '../shared/configuration';
import { iUser } from '../models/user';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService, private readonly configuration: Configuration) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configuration.jwt.secret,
    });
  }

  async validate(payload: iUser) {
    const user = await this.authService.validateUser(payload);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
  

  async verifyJwt(token: string): Promise<iUser|boolean> {
    try {
      return new Promise<iUser>(resolve => {
        jwt.verify(token, this.configuration.jwt.secret, async (err, decoded) => {
          resolve(await this.authService.validateUser(decoded) ? decoded : false);
        })
      })

    }
    catch (e) {
      console.log(e);
    }
  }
}