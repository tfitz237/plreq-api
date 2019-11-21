import * as fs from 'fs';
import { Error } from '../../models/status';
import { Injectable } from '@nestjs/common';
import { IConfiguration } from 'models/config';
import { IUser } from '../../models/user';

@Injectable()
export default class Configuration {
    error: Error;
    _jd: any;
    _jwt: IConfiguration['jwt'];
    creds: any;
    _filePaths: any;
    _users: any;
    _iti: any;
    _plex: any;
    _tmdb: any;

    get jd(): IConfiguration['jd'] { 
        return this._jd || this.getConfig().jd;
    }
    get plex(): IConfiguration['plex'] {
        return this._plex || this.getConfig().plex;
    }
    get jwt(): IConfiguration['jwt'] {
        return this._jwt || this.getConfig().jwt;
    }
    get filePaths(): IConfiguration['filePaths'] {
        return this._filePaths || this.getConfig().filePaths;
    }
    get users(): IUser[] {
        return this._users || this.getConfig().users;
    }
    get iti(): IConfiguration['iti'] {
        return this._iti || this.getConfig().iti;
    }
    get tmdb(): IConfiguration['tmdb'] {
        return this._tmdb || this.getConfig().tmdb;
    }

    getConfig(): IConfiguration {
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