import { iUser } from "./user";

export interface iConfiguration {
    jd: {
        email: string,
        password: string
    },
    jwt: {
        secret
    },
    filePaths: {
        dir: string,
        tvDestination: string,
        movieDestination: string
    },
    users: iUser[],
    iti: {
        host: string,
        user: string,
        pass: string
    },
    plex: {
        dbLocation: string;
    },
    tmdb: {
        apiKey: string;
    }
}