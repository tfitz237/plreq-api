import { Injectable } from '@nestjs/common';
import axios from 'axios';
import Configuration from '../shared/configuration';
import { Logger, LogMe } from '../shared/log.service';
import { LogLevel } from '../shared/log.entry.entity';
import { itiLink, itiError, itiQuery, itiLinkResponse } from '../models/iti';
import { TmdbService } from '../tmdb/tmdb.service';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
@Injectable()
export class ItiService extends LogMe {
    isLoggedIn: boolean;
    cookie: any;

    constructor( 
        private readonly config: Configuration, private readonly logService: Logger, private readonly tmdbService: TmdbService) {
        super(logService);
    }
    async search(query: itiQuery, retry: number = 0, results = [] ): Promise<itiLinkResponse|itiError> {
        if (await this.ensureLoggedIn()) {
            try {
                const result = await axios.get(`${this.config.iti.host}/ajax.php`, {
                    params: {
                        i: 'main',
                        which: encodeURIComponent(query.query),
                        s: (retry * 50) + 1,
                        p: query.parent,
                        c: query.child
                    },
                    headers:{
                        'Cookie': this.cookie
                    }
                });
                if (result.data && result.data.length > 0) {
                    const filtered = result.data.filter(link => 
                        query.query.split(' ').every(q => 
                            (link.parent == 'Movies' || link.parent == 'TV') 
                                && link.title.toLowerCase().includes(q.toLowerCase())
                        )
                    );
                    results = results.concat(filtered);
                    if (filtered.length < result.data.length && results.length < 50) {
                        return this.search(query, ++retry, results);
                    }
                }          
                this.log(this.search, LogLevel.INFORMATION, `Query: ${query}. Found ${results.length} filtered results`);     
                return {
                    page: retry,
                    results: results
                };
            }
            catch (e) {
                console.log(e);
                return e;
            }
        }
        else {
            return {
                loggedIn: false
            };
        }
    }


    async getLinks(linkId: string): Promise<any> {
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

    async getImageRef(linkId: string): Promise<string[]> {
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
                return this.findImagesInPage(result.data);
            }
            catch (e) {
                console.log(e);
                return e;
            }
        }
    }

    async findEpisode(name: string, season: any, episode: any, exists: boolean = false): Promise<itiLink|itiError> {
        if (!exists) {
            const fullSeason = await this.tmdbService.getSeasonList(name, season);
            if (!fullSeason.find(x => parseInt(episode) == x)) {
                return {
                    error: `${name} s${season}e${episode} does not exist`
                };
            }
        }
        const formats =   [
                `${name} s${season.toString().padStart(2, '0')}e${episode.toString().padStart(2, '0')}`,
                `${name} s${season}e${episode}`
        ];
        let rtn;
        for(var i in formats) {
            const query: itiQuery = {
                query: formats[i],
                parent: "TV",
                child: ""
            }
            const results = await this.search(query) as itiLinkResponse;
            if (results.results.length > 0) {
                const hdResult = results.results.find(l => l.child == "HD");
                if (hdResult) {
                    rtn = hdResult;
                } else {
                    rtn = results.results[0];
                }
            }
            if (rtn && rtn.child == "HD") {
                return rtn;
            }
        }
        if (rtn) {
            return rtn;
        }

        return {
            error: "Episode Not Found"
        };
    }
    

    async findSeason(name: string, season: number) {
        let results = [];
        const episodes = await this.tmdbService.getSeasonList(name, season);
        if (episodes && episodes.length > 0) {
            episodes.forEach(episode => results.push(this.findEpisode(name, season, episode, true)));
        } 
        return await Promise.all(results);
    }


    findLinksInPage(html: string): string[] {       
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

    findImagesInPage(html: string): string[] {
        const images = [];
        const imagesDiv = html.match(/<div.*id=\"links_imgref\">(.*)<\/div>/);
        var httpRegex = "https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)";
        if (imagesDiv) {
            const reg = /<a href="(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*))" target="_blank">(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*))<\/a><br class="clear" \/>/;
            const gReg = /<a href="(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*))" target="_blank">(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*))<\/a><br class="clear" \/>/g;            
            const linksInDiv = imagesDiv[1].match(gReg);
            if (linksInDiv) {
                linksInDiv.forEach(link => {
                    const match = link.match(reg);
                    if (match) {
                        images.push(match[1]);
                    }
                });
            }
        }
        return images;
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
