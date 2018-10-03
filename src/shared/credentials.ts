import * as fs from 'fs';
import { Error } from "../models/status";
import { Injectable } from '@nestjs/common';

//@Injectable()
export default class Credentials {
    error: Error;
    _jd: any;
    _jwt: any;
    creds: any;
    get jd() { 
        return this._jd || this.getCreds().jd;
    }
    get jwt() {
        return this._jwt || this.getCreds().jwt;
    }

    getCreds(): any {
        let file;
        try {
            file = fs.readFileSync('credentials.json', 'utf8');
        } catch (e) {
            this.error = { src: 'fs', type: e}
        }
        const creds = JSON.parse(file);
        this._jd = creds.jd;
        this._jwt = creds.jwt;

        return creds;
    }

}