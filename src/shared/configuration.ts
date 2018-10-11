import * as fs from 'fs';
import { Error } from "../models/status";
import { Injectable } from '@nestjs/common';
import { iConfiguration } from 'models/config';
import { iUser } from '../models/user';

@Injectable()
export default class Configuration {
    error: Error;
    _jd: any;
    _jwt: iConfiguration["jwt"];
    creds: any;
    _filePaths: any;
    _users: any;
    get jd(): iConfiguration["jd"] { 
        return this._jd || this.getConfig().jd;
    }
    get jwt(): iConfiguration["jwt"] {
        return this._jwt || this.getConfig().jwt;
    }
    get filePaths(): iConfiguration["filePaths"] {
        return this._filePaths || this.getConfig().filePaths;
    }
    get users(): iUser[] {
        return this._users || this.getConfig().users;
    }

    getConfig(): iConfiguration {
        let file;
        try {
            file = fs.readFileSync('config.json', 'utf8');
        } catch (e) {
            this.error = { src: 'fs', type: e}
        }
        const creds = JSON.parse(file);
        this._jd = creds.jd;
        this._jwt = creds.jwt;
        this._filePaths = creds.filePaths;
        this._users = creds.users;
        return creds;
    }

}