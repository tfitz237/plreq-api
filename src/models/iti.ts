export interface itiLink {
    linkid: string;
    parent: string;
    child: string;
    title: string;
    tags: string;
    datetime: string;
    links_imgref: string;
    poster: string;
}

export interface itiError {
    loggedIn?: boolean;
    error?: string;
}

export interface itiQuery {
    query: string;
    parent: string;
    child: string;
    page?: number;
}

export interface itiTvShowQuery {
    id?: number;
    name: string;
    season?: number;
    episode?: number;
    single?: boolean;
}

export interface itiLinkResponse {
    results: itiLink[];
    page: number;
}