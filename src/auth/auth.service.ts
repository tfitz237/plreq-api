import { Injectable } from '@nestjs/common';
import * as pwHash from 'password-hash';
import { JwtService } from '@nestjs/jwt';


export enum UserLevel {
    Guest,
    User,
    Admin,
    SuperAdmin
}

@Injectable()
export class AuthService {
    constructor(private readonly jwtService: JwtService) {}

    validateUser(payload: iUser): Promise<boolean> {
        const user = Users.find(u => u.userGuid == payload.userGuid && u.level > UserLevel.Guest); 
        return Promise.resolve(!!user);
    }

    requestToken(inputUser: iUser): Promise<string> {
        // TODO: Database integration for un/pw
        const user = Users.find(u => u.username == inputUser.username && pwHash.verify(inputUser.password, u.password)); 
        return Promise.resolve(!!user ? this.jwtService.sign({ userGuid: user.userGuid }) : null);
    }
}

const Users : iUser[] = [
    {
        username: 'admin',
        password: pwHash.generate('password'),
        userGuid: guid(),
        level: UserLevel.SuperAdmin
    }
]

export interface iUser {
    username: string;
    password: string;
    userGuid: string;
    level: number;
}

function guid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  }