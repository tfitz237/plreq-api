import { Injectable, UseGuards } from '@nestjs/common';
import * as pwHash from 'password-hash';
import { JwtService } from '@nestjs/jwt';
import { IUser } from '../models/user';
import Configuration from '../shared/configuration/configuration';
import { Repository, MoreThan } from 'typeorm';
import { User } from './auth.user.entity';
import { InjectRepository } from '@nestjs/typeorm';

export enum UserLevel {
    Guest,
    User,
    ItiUser,
    Admin,
    SuperAdmin,
}

@Injectable()
export class AuthService {
    users: IUser[];
    constructor(private readonly jwtService: JwtService,
                private readonly config: Configuration,
                @InjectRepository(User) private readonly userRepo: Repository<User>,
        ) {
    }

    async validateUser(payload: IUser): Promise<boolean> {
        if (payload) {
            const user = await this.userRepo.findOne({userGuid: payload.userGuid, level: MoreThan(UserLevel.Guest)});
            return !!user;
        }
        return false;
    }

    async requestToken(inputUser: IUser): Promise<string> {
        const user = await this.userRepo.findOne({ username: inputUser.username});
        const verified = user ? pwHash.verify(inputUser.password, user.password) : false;
        return Promise.resolve(verified ? this.jwtService.sign({ userGuid: user.userGuid, username: user.username, level: user.level }) : null);
    }

    async createUser(payload: IUser) {
        const user = await this.userRepo.findOne({userGuid: payload.userGuid});
        if (user && !user.username && !user.password){
            user.password = pwHash.generate(payload.password);
            user.level = UserLevel.User;
            user.username = payload.username;
            const success = await this.userRepo.save(user);
            return !!success;
        }

        return false;
    }
}

// function guid() {function s4() {return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);}return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();}

export function guid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  }