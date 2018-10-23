import { Injectable } from '@nestjs/common';
import axios from 'axios';
import Configuration from '../shared/configuration';
import { Logger, LogMe } from '../shared/log.service';
import { LogLevel } from '../shared/log.entry.entity';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
@Injectable()
export class ItiService extends LogMe {
    isLoggedIn: boolean;
    cookie: any;
    constructor(private readonly config: Configuration, private readonly logService: Logger) {
        super(logService);
    }
    async search(query: any, results = [], retry: number = 0): Promise<any> {
        if (await this.ensureLoggedIn()) {
            try {
                const result = await axios.get(`${this.config.iti.host}/ajax.php`, {
                    params: {
                        i: 'main',
                        which: encodeURIComponent(query.query),
                        s: (retry * 100) + 1,
                        p: query.parent,
                        c: query.child
                    },
                    headers:{
                        'Cookie': this.cookie
                    }
                });
                if (result.data && result.data.length > 0) {
                    const filtered = result.data.filter(link => query.query.split(' ').every(q => (link.parent == 'Movies' || link.parent == 'TV') && link.title.toLowerCase().includes(q.toLowerCase())));
                    results = results.concat(filtered);
                    if (filtered.length < result.data.length && results.length < 100) {
                        return this.search(query, results, ++retry);
                    }
                }          
                this.log(this.search, LogLevel.INFORMATION, `Query: ${query}. Found ${results.length} filtered results`);     
                return results;
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


    async getLinks(linkId: number): Promise<any> {
        if (await this.ensureLoggedIn()) {
            try {
                const result = await axios.get(this.config.iti.host, {
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


    findLinksInPage(html: string) {       
        const links = [];
        const linksDiv = html.match(/<div.*id=\"links_mega\">(.*)<\/div>.*<div.*Password/);
        if (linksDiv) {
            const reg =  /<b>\d+<\/b>\s-\s<a href=\"(https:\/\/[A-Za-z-.]+\/#[!#\-_A-Za-z0-9]+)\" target=\"_blank\">(https:\/\/[A-Za-z-.]+\/#[!#\-_A-Za-z0-9]+)<\/a><br class=\"clear\" \/>/;
            const gReg = /<b>\d+<\/b>\s-\s<a href=\"(https:\/\/[A-Za-z-.]+\/#[!#\-_A-Za-z0-9]+)\" target=\"_blank\">(https:\/\/[A-Za-z-.]+\/#[!#\-_A-Za-z0-9]+)<\/a><br class=\"clear\" \/>/g;
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

    private async ensureLoggedIn(): Promise<boolean> {
        const status = await this.loginStatus();
        if(status) {
            return true;
        } else {
            return await this.login();
        }

    }

    private async loginStatus(): Promise<boolean> {
        try {
            const headers = {};
            if (this.cookie) {
                headers['Cookie'] = this.cookie;
            }
            const result = await axios.get(`${this.config.iti.host}`, { headers: headers });
            if (result.headers['set-cookie']) {
                this.cookie = result.headers['set-cookie'][0];
            }
            return result.data.includes('<a id="icon_logout" href="?i=logout">');
        }
        catch (e) {
            console.log(e);
            return false;
        }
    }

    private async login(retry: boolean = false): Promise<boolean> {
        try {
            let result = await axios.post(this.config.iti.host, `user=${this.config.iti.user}&pass=${this.config.iti.pass}`, {
                params: {
                    'i': 'redirect'
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Cookie': this.cookie
                },
                withCredentials: true
            });            
            return result.data.includes('<a id="icon_logout" href="?i=logout">');
        }
        catch (e) {
            console.log(e);
            return false;
        }
    }
}
