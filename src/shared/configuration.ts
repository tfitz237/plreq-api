import * as fs from 'fs';
import { Error } from "../models/status";
import { Injectable } from '@nestjs/common';

//@Injectable()
export default class Configuration {
    error: Error;
    _jd: any;
    _jwt: any;
    creds: any;
    _filePaths: any;
    _users: any;
    get jd() { 
        return this._jd || this.getConfig().jd;
    }
    get jwt() {
        return this._jwt || this.getConfig().jwt;
    }
    get filePaths() {
        return this._filePaths || this.getConfig().filePaths;
    }
    get users() {
        return this._users || this.getConfig().users;
    }

    getConfig(): any {
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
        return creds;
    }

}