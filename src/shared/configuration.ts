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
    _iti: any;
    _plex: any;
    _tmdb: any;
    
    get jd(): iConfiguration["jd"] { 
        return this._jd || this.getConfig().jd;
    }
    get plex(): iConfiguration["plex"] {
        return this._plex || this.getConfig().plex;
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
    get iti(): iConfiguration["iti"] {
        return this._iti || this.getConfig().iti;
    }
    get tmdb(): iConfiguration["tmdb"] {
        return this._tmdb || this.getConfig().tmdb;
    }

    getConfig(): iConfiguration {
        let file;
        try {
            file = fs.readFileSync('config.json', 'utf8');
        } catch (e) {
            this.error = { src: 'fs', type: e}
        }
        const config = JSON.parse(file);
        this._jd = config.jd;
        this._jwt = config.jwt;
        this._filePaths = config.filePaths;
        this._users = config.users;
        this._iti = config.iti;
        this._tmdb = config.tmdb;
        return config;
    }

}