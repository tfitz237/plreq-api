export interface ItiLink {
    linkid: string;
    parent: string;
    child: string;
    title: string;
    tags: string;
    datetime: string;
    links_imgref: string;
    poster: string;
}

export interface ItiError {
    loggedIn?: boolean;
    error?: string;
}

export interface ItiQuery {
    query: string;
    parent: string;
    child: string;
    page?: number;
}

export interface ItiTvShowQuery {
    id?: number;
    name: string;
    season?: number;
    episode?: number;
    single?: boolean;
}

export interface ItiLinkResponse {
    results: ItiLink[];
    page: number;
}

export interface ItiDetails {
    links: string[];
    imageref: string[];
    tags: string[];
    info: string;
}