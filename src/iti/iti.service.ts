import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as FormData from 'form-data';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
@Injectable()
export class ItiService {
    isLoggedIn: boolean;
    cookie: any;
    constructor() {

    }
    host = 'https://intotheinter.net';
    user = '***REMOVED***';
    pass = '***REMOVED***';
    sessionId = '';
    async search(query: string): Promise<any> {
        if (this.isLoggedIn || await this.login()) {
            try {
                const result = await axios.get(`${this.host}/ajax.php`, {
                    params: {
                        i: 'main',
                        which: encodeURIComponent(query),
                        s: 1,
                        p: ''
                    },
                    headers:{
                        'Cookie': this.cookie
                    }
                });
                if (result.data && result.data.length > 0) {
                    return result.data.filter(link => link.parent == "Movies" || link.parent == "TV");
                }
                return result.data;
            }
            catch (e) {
                console.log(e);
                return e;
            }
        }
        else {
            return false;
        }
    }


    findLinksInPage(html: string) {       
        const links = [];
        const linksDiv = html.match(/<div.*id=\"links_mega\">(.*)<\/div>.*<div.*Password/);
        if (linksDiv) {
            const reg =  /<b>\d+<\/b>\s-\s<a href=\"(https:\/\/mega.co.nz\/#[!#\-_A-Za-z0-9]+)\" target=\"_blank\">(https:\/\/mega.co.nz\/#[!#\-_A-Za-z0-9]+)<\/a><br class=\"clear\" \/>/;
            const gReg = /<b>\d+<\/b>\s-\s<a href=\"(https:\/\/mega.co.nz\/#[!#\-_A-Za-z0-9]+)\" target=\"_blank\">(https:\/\/mega.co.nz\/#[!#\-_A-Za-z0-9]+)<\/a><br class=\"clear\" \/>/g;
            const linksInDiv = linksDiv[1].match(gReg);
            if (linksInDiv) {
                linksInDiv.forEach(link => {
                    const match = link.match(reg);
                    if (match) {
                        links.push(match[1]);
                    }
                })
            }
        }
        return links;
    }

    async getLinks(linkId: number): Promise<any> {
        if (this.isLoggedIn || await this.login()) {
            try {
                const result = await axios.get(this.host, {
                    params: {
                        'i': `SIG:${linkId}`
                    },
                    headers: {
                        'Cookie': this.cookie
                    }
                });
                return this.findLinksInPage(result.data);
            }
            catch (e) {
                console.log(e);
                return e;
            }
        }
    }

    async login(retry: boolean = false): Promise<boolean> {
        try {
            const formData = new FormData();
            formData.append('user', this.user);
            formData.append('pass', this.pass);
            const headers ={
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.54 Safari/537.36',
                'Connection': 'keep-alive'
            };
            if (this.cookie) {
                headers['Cookie'] = this.cookie;
            }
            let result = await axios.post(this.host, `user=${this.user}&pass=${this.pass}`, {
                params: {
                    'i': 'redirect'
                },
                headers: headers,
                withCredentials: true
            });
            if (!this.cookie) {
                this.cookie = result.headers['set-cookie'] ? result.headers['set-cookie'][0]: '';
                if (!retry) {
                    return this.login(true);
                }
            }
            if (result.data.includes('<a id="icon_logout" href="?i=logout">')) {
                this.isLoggedIn = true;
                return true;
            }
            return false;
        }
        catch (e) {
            console.log(e);
            return false;
        }
    }
}
