import { Injectable, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as pwHash from 'password-hash';
import { MoreThan, Repository } from 'typeorm';
import { iUser } from '../models/user';
import Configuration from '../shared/configuration';
import { User } from './auth.user.entity';

export enum UserLevel {
    Guest,
    User,
    ItiUser,
    Admin,
    SuperAdmin,
}

@Injectable()
export class AuthService {
    users: iUser[];
    constructor(private readonly jwtService: JwtService,
                private readonly config: Configuration,
                @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        ) {
    }

    async validateUser(payload: iUser): Promise<boolean> {
        if (payload) {
            const user = await this.userRepo.findOne({userGuid: payload.userGuid, level: MoreThan(UserLevel.Guest)});
            return !!user;
        }
        return false;
    }

    async requestToken(inputUser: iUser): Promise<string> {
        const user = await this.userRepo.findOne({ username: inputUser.username});
        const verified = user ? pwHash.verify(inputUser.password, user.password) : false;
        return verified ? this.jwtService.sign({ userGuid: user.userGuid, username: user.username, level: user.level }) : null;
    }

    requestEmailToken(user: User) {
        return this.jwtService.sign({username: user.username}, { expiresIn: '1h'});
    }

    async createUser(payload: iUser) {
        const user = await this.userRepo.findOne({userGuid: payload.userGuid});
        if (user && this.isValidEmail(user.username) && !user.password){
            user.password = pwHash.generate(payload.password);
            user.level = UserLevel.User;
            user.username = payload.username;
            user.emailVerified = false;
            const success = await this.userRepo.save(user);
            return !!success;
        }

        return false;
    }

    // Only need to check for basics (@ symbol and period) because sending an email verification
    // will be the check to see if the email exists
    isValidEmail(email: string): boolean {
        const regEx = /.+@\w+\.\w+/;
        return regEx.test(email);
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