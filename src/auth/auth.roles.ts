import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IUser } from '../models';
import { UserLevel } from '../shared/constants';
import {JwtStrategy} from './jwt.strategy';
export const Roles = (...roles: UserLevel[]) => SetMetadata('roles', roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly jwtStrategy: JwtStrategy) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<UserLevel[]>('roles', context.getHandler());
    if (!roles || roles.indexOf(UserLevel.Guest) !== -1) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    if (request.headers.authorization) {
        const verify = await this.jwtStrategy.verifyJwt(request.headers.authorization.split(' ')[1]);
        if (verify !== false) {
            const user = verify as IUser;
            return user.level >= roles[0];
        }
    }
    return false;
  }
}