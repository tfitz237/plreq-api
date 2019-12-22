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
import { AxiosRequestConfig, AxiosResponse } from 'axios';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
@Injectable()
export class ItiService {
    cookie: any;

    categoryMap = {
        Movies: 4,
        TV: 7,
    };

    sectionMap = {
        SD: 15,
        HD: 20,
    };
    constructor(
        @Inject('Configuration')
        private readonly config: IConfiguration,
        private readonly logService: LogService,
        private readonly tmdbService: TmdbService,
        private readonly httpService: HttpService) {
    }

    async search(request: ItiQuery): Promise<ItiLinkResponse|ItiError> {
        try {
            request.page = request.page ? request.page : 1;
            const $ = await this.requestParsed({
                method: 'GET',
                url: `${this.config.iti.host}/`,
                params: {
                    'category[]': this.categoryMap[request.parent],
                    'section[]': this.sectionMap[request.child],
                    'advs': 'y',
                    'linksin': 'title',
                    'addedby': 'anyone',
                    'flall': request.query,
                    'pg': request.page,
                }
            });
            if (!$) {
                return {
                    error: 'search could not be completed',
                };
            }
            const links: ItiLink[] = [];
            $('#links .row').not('.header').each(function (i, el) {
                const tags = [];
                $(this).find('div a.utagsforlinks').each(function (i, el) {
                    tags.push($(this).text());
                });

                links.push({
                    linkid: $(this).find('a.poster').attr('href').replace('?i=SIG:', ''),
                    title: $(this).find('a.poster .title > span:first-child').text(),
                    parent: request.parent,
                    child: request.child,
                    user_tags: tags,
                    tags: $(this).find('div.title span.tags').text().replace(request.child + ' ', '').split(' '),
                    datetime: $(this).find('.date')[0].children.find(x => x.type === 'text').data.trimRight(),
                    links_imgref: $(this).find('a.poster em img').attr('src'),

                });
            });
            return {
                results: links,
                page: 1,
            };
        }
        catch (e) {
            console.error(e);
        }
    }

    async getDetails(linkId: string): Promise<ItiDetails> {
        try {
            const result = await this.requestParsed({
                method: 'GET',
                url: this.config.iti.host,
                params: {
                    i: `SIG:${linkId}`,
                }
            });
            const response = {
                imageref: this.getImageRefInPage(result),
                tags: this.getUserTags(result),
                info: this.getInfo(result),
            };
            return response;
        }
        catch (e) {
            this.logService.logError('getDetails', 'Error getting Details', e);
            return e;
        }
    }

    async getLinks(linkId: string): Promise<string[]> {
        try {
            const result = await this.requestParsed({
                method: 'GET',
                url: this.config.iti.host,
                params: {
                    i: `SIG:${linkId}`,
                }
            });
            return this.getLinksInPage(result);
        }
        catch (e) {
            this.logService.logError('getLinks', 'Error getting links', e);
            return e;
        }
    }

    async getImageRef(linkId: string): Promise<string[]> {
        try {
            const result = await this.requestParsed({
                method: 'GET',
                url: this.config.iti.host,
                params: {
                    i: `SIG:${linkId}`,
                }
            });
            return this.getImageRefInPage(result);
        }
        catch (e) {
            this.logService.logError('getImageRef', 'Error getting imageRef', e);
            return e;
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

    private async requestParsed(request: AxiosRequestConfig, attempt: number = 0): Promise<CheerioStatic> {
        try {
            if (this.cookie) {
                request.headers = request.headers || {};
                request.headers.Cookie = this.cookie;
            }
            const result = await this.httpService.request(request).toPromise();
            if (result.headers['set-cookie']) {
                this.cookie = result.headers['set-cookie'][0];
            }
            const $ = Cheerio.load(result.data);
            if (this.isLoggedIn($)) {
                return $;
            } else {
                if (attempt < 2 && await this.login()) {
                    return await this.requestParsed(request, ++attempt);
                }
                else {
                    return null;
                }
            }
        }
        catch (e) {
            return e;
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
            return this.isLoggedIn(Cheerio.load(result.data));
        }
        catch (e) {
            this.logService.logError('login', 'Failed to login', e);
            return false;
        }
    }

    private isLoggedIn($: CheerioStatic): boolean {
        return $('#icon_logout').attr('href') !== undefined;
    }

    private filterSearchResult(link: ItiLink, query: string) {
        return query.split(' ').every(word =>
            (link.parent === 'Movies' || link.parent === 'TV')
                && link.title.toLowerCase().includes(word.toLowerCase()));
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

    
}
