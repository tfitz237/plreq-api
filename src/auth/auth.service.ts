import { Injectable } from '@nestjs/common';
import * as pwHash from 'password-hash';
import { JwtService } from '@nestjs/jwt';
import { iUser } from '../models/user';
import Configuration from '../shared/configuration';


export enum UserLevel {
    Guest,
    User,
    Admin,
    SuperAdmin
}

@Injectable()
export class AuthService {
    users: iUser[];
    constructor(private readonly jwtService: JwtService, private readonly config: Configuration) {
        this.users = this.config.users.map(user => {
            user.password = pwHash.generate(user.password);
            return user;
        });
    }

    validateUser(payload: iUser): Promise<boolean> {
        const user = this.users.find(u => u.userGuid == payload.userGuid && u.level > UserLevel.Guest); 
        return Promise.resolve(!!user);
    }

    requestToken(inputUser: iUser): Promise<string> {
        // TODO: Database integration for un/pw
        const user = this.users.find(u => u.username == inputUser.username && pwHash.verify(inputUser.password, u.password)); 
        return Promise.resolve(!!user ? this.jwtService.sign({ userGuid: user.userGuid }) : null);
    }
}



export function guid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  }