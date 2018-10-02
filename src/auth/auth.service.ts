import { Injectable } from '@nestjs/common';
import * as pwHash from 'password-hash';


export enum UserLevel {
    Guest,
    User,
    Admin,
    SuperAdmin
}

@Injectable()
export class AuthService {
    constructor() {}

    validateUser(token: string): Promise<boolean> {
        const user = Users.find(u => u.bearerToken == token && u.level > UserLevel.Guest); 
        return Promise.resolve(!!user);
    }

    requestToken(inputUser: iUser): Promise<string> {
        // TODO: Database integration for un/pw
        const user = Users.find(u => u.username == inputUser.username && pwHash.verify(inputUser.password, u.password)); 
        
        return Promise.resolve(!!user ? user.bearerToken : null);
    }
}

const Users : iUser[] = [
    {
        username: 'admin',
        password: pwHash.generate('password'),
        id: 0,
        bearerToken: 'swfqiGmRW4GaIuRj54GsxgZXd55FpZcG',
        level: UserLevel.SuperAdmin
    }
]

export interface iUser {
    username: string;
    password: string;
    id: number;
    bearerToken: string;
    level: number;
}

