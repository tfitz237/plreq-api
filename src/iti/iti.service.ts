import { Injectable, Inject, HttpService } from '@nestjs/common';
import {
    ItiError,
    ItiLink,
    ItiLinkResponse,
    ItiQuery, ItiDetails,
    IConfiguration,
    LogLevel
} from '../models';
import { LogService } from '../shared/log/log.service';
import { TmdbService } from '../tmdb/tmdb.service';
import * as Cheerio from 'cheerio';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
@Injectable()
export class ItiService {
    isLoggedIn: boolean;
    cookie: any;
    constructor(
        @Inject('Configuration')
        private readonly config: IConfiguration,
        private readonly logService: LogService,
        private readonly tmdbService: TmdbService,
        private readonly httpService: HttpService) {
    }

    async search(request: ItiQuery, retry: number = 0, results: ItiLink[] = [] ): Promise<ItiLinkResponse|ItiError> {
        if (await this.ensureLoggedIn()) {
            try {
                const result = await this.httpService.get(`${this.config.iti.host}/ajax.php`, {
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
                }).toPromise();
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
                this.logService.logInfo('search', `Query: ${JSON.stringify(request)}. Found ${results.length} filtered results`);
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

    async getDetails(linkId: string): Promise<ItiDetails> {
        if (await this.ensureLoggedIn()) {
            try {
                const result = await this.httpService.get(this.config.iti.host, {
                    params: {
                        i: `SIG:${linkId}`,
                    },
                    headers: {
                        Cookie: this.cookie,
                    },
                }).toPromise();
                const html = Cheerio.load(result.data);
                const response = {
                    imageref: this.getImageRefInPage(html),
                    tags: this.getUserTags(html),
                    info: this.getInfo(html),
                };
                return response;
            }
            catch (e) {
                this.logService.logError('getDetails', 'Error getting Details', e);
                return e;
            }
        }
    }

    async getLinks(linkId: string): Promise<string[]> {
        if (await this.ensureLoggedIn()) {
            try {
                const result = await this.httpService.get(this.config.iti.host, {
                    params: {
                        i: `SIG:${linkId}`,
                    },
                    headers: {
                        Cookie: this.cookie,
                    },
                }).toPromise();
                return this.getLinksInPage(Cheerio.load(result.data));
            }
            catch (e) {
                this.logService.logError('getLinks', 'Error getting links', e);
                return e;
            }
        }
    }

    async getImageRef(linkId: string): Promise<string[]> {
        if (await this.ensureLoggedIn()) {
            try {
                const result = await this.httpService.get(this.config.iti.host, {
                    params: {
                        i: `SIG:${linkId}`,
                    },
                    headers: {
                        Cookie: this.cookie,
                    },
                }).toPromise();
                return this.getImageRefInPage(Cheerio.load(result.data));
            }
            catch (e) {
                this.logService.logError('getImageRef', 'Error getting imageRef', e);
                return e;
            }
        }
    }

    async findSeason(name: string, season: number) {
        const results = [];
        const episodes = await this.tmdbService.getSeasonList(name, season);
        if (episodes && episodes.length > 0) {
            episodes.forEach(episode => results.push(this.findEpisode(name, season, episode, true)));
        }
        return await Promise.all(results);
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

    private getLinksInPage($: CheerioStatic): string[] {
        return $('div#links_mega a').toArray().map(x => x.attribs.href);
    }

    private getImageRefInPage($: CheerioStatic): string[] {
        return $('div#links_imgref a').toArray().map(x => x.attribs.href);
    }

    private getInfo($: CheerioStatic): string {
        $('div#info').find('br').replaceWith('\n');
        return $('div#info').text();
    }

    private getUserTags($: CheerioStatic): string[] {
        return $('div#utags button').toArray().map(x => x.children[0].data);
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
            const headers: any = {};
            if (this.cookie) {
                headers.Cookie = this.cookie;
            }
            const result = await this.httpService.get(`${this.config.iti.host}`, { headers }).toPromise();
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
            const result = await this.httpService.post(this.config.iti.host, `user=${this.config.iti.user}&pass=${this.config.iti.pass}`, {
                params: {
                    i: 'redirect',
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Cookie': this.cookie,
                },
                withCredentials: true,
            }).toPromise();
            return result.data.includes('<a id="icon_logout" href="?i=logout">');
        }
        catch (e) {
            console.log(e);
            return false;
        }
    }
}
