import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ItiError, ItiLink, ItiLinkResponse, ItiQuery } from '../models/iti';
import ConfigurationService from '../shared/configuration/configuration.service';
import { LogLevel } from '../shared/log/log.entry.entity';
import { Logger } from '../shared/log/log.service';
import { TmdbService } from '../tmdb/tmdb.service';
import { LogMe } from '../shared/log/logme';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
@Injectable()
export class ItiService extends LogMe {
    isLoggedIn: boolean;
    cookie: any;
    constructor(
        private readonly configService: ConfigurationService, private readonly logService: Logger, private readonly tmdbService: TmdbService) {
        super(logService);
    }

    async config() {
        return await this.configService.getConfig();
    }
    async search(request: ItiQuery, retry: number = 0, results: ItiLink[] = [] ): Promise<ItiLinkResponse|ItiError> {
        if (await this.ensureLoggedIn()) {
            try {
                const config = await this.config();
                const result = await axios.get(`${config.iti.host}/ajax.php`, {
                    params: {
                        i: 'main',
                        which: request.query,
                        s: (retry * 50) + 1,
                        p: request.parent,
                        c: request.child,
                        o: 'null',
                        what: 'null',
                        series: 'null',
                    },
                    headers: {
                        Cookie: this.cookie,
                    },
                });
                const searchResults = result.data;
                searchResults.shift();
                searchResults.shift();
                if (searchResults && searchResults.length > 0) {
                    const filtered = searchResults.filter(link => this.filterSearchResult(link, request.query));
                    results = results.concat(filtered);
                    if (filtered.length < searchResults.length && results.length < 50) {
                        return this.search(request, ++retry, results);
                    }
                }
                this.log(this.search, LogLevel.INFORMATION, `Query: ${JSON.stringify(request)}. Found ${results.length} filtered results`);
                return {
                    page: retry,
                    results,
                };
            }
            catch (e) {
                console.log(e);
                return e;
            }
        }
        else {
            return {
                loggedIn: false,
            };
        }
    }

    filterSearchResult(link: ItiLink, query: string) {
        return query.split(' ').every(word =>
            (link.parent === 'Movies' || link.parent === 'TV')
                && link.title.toLowerCase().includes(word.toLowerCase()));
    }

    async getLinks(linkId: string): Promise<string[]> {
        if (await this.ensureLoggedIn()) {
            try {
                const config = await this.config();
                const result = await axios.get(config.iti.host, {
                    params: {
                        i: `SIG:${linkId}`,
                    },
                    headers: {
                        Cookie: this.cookie,
                    },
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
                const config = await this.config();
                const result = await axios.get(config.iti.host, {
                    params: {
                        i: `SIG:${linkId}`,
                    },
                    headers: {
                        Cookie: this.cookie,
                    },
                });
                return this.findImagesInPage(result.data);
            }
            catch (e) {
                console.log(e);
                return e;
            }
        }
    }

    async findEpisode(name: string, season: any, episode: any, exists: boolean = false): Promise<ItiLink|ItiError> {
        if (!exists) {
            const fullSeason = await this.tmdbService.getSeasonList(name, season);
            if (!fullSeason.find(x => parseInt(episode) === x)) {
                return {
                    error: `${name} s${season}e${episode} does not exist`,
                };
            }
        }
        const formats =   [
                `${name} s${season.toString().padStart(2, '0')}e${episode.toString().padStart(2, '0')}`,
                `${name} s${season}e${episode}`,
        ];
        let rtn;
        for (const i in formats) {
            if (formats[i]) {
                const query: ItiQuery = {
                    query: formats[i],
                    parent: 'TV',
                    child: '',
                };
                const res = await this.search(query) as ItiLinkResponse;
                if (res && res.results && res.results.length > 0) {
                    const hdResult = res.results.find(l => l.child === 'HD');
                    if (hdResult) {
                        rtn = hdResult;
                    } else {
                        rtn = res.results[0];
                    }
                }
                if (rtn && rtn.child === 'HD') {
                    return rtn;
                }
            }
        }
        if (rtn) {
            return rtn;
        }

        return {
            error: 'Episode Not Found',
        };
    }

    async findSeason(name: string, season: number) {
        const results = [];
        const episodes = await this.tmdbService.getSeasonList(name, season);
        if (episodes && episodes.length > 0) {
            episodes.forEach(episode => results.push(this.findEpisode(name, season, episode, true)));
        }
        return await Promise.all(results);
    }

    findLinksInPage(html: string): string[] {
        const links = [];
        const linksDiv = html.match(/<div.*id=\"links_mega\" data-watch-this="">(.*)<\/div>.*<div.*Password/);
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
                });
            }
        }
        return links;
    }

    findImagesInPage(html: string): string[] {
        const images = [];
        const imagesDiv = html.match(/<div.*id=\"links_imgref\" data-watch-this="">(.*)<\/div>/);
        const httpRegex = 'https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)';
        if (imagesDiv) {
            // tslint:disable-next-line: max-line-length
            const reg = /<a href="(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*))" target="_blank">(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*))<\/a><br class="clear" \/>/;
            // tslint:disable-next-line: max-line-length
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
        if (status) {
            return true;
        } else {
            return await this.login();
        }

    }

    private async loginStatus(): Promise<boolean> {
        try {
            const config = await this.config();
            const headers: any = {};
            if (this.cookie) {
                headers.Cookie = this.cookie;
            }
            const result = await axios.get(`${config.iti.host}`, { headers });
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
        const config = await this.config();
        try {
            const result = await axios.post(config.iti.host, `user=${config.iti.user}&pass=${config.iti.pass}`, {
                params: {
                    i: 'redirect',
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Cookie': this.cookie,
                },
                withCredentials: true,
            });
            return result.data.includes('<a id="icon_logout" href="?i=logout">');
        }
        catch (e) {
            console.log(e);
            return false;
        }
    }
}
