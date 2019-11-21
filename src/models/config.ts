import { IUser } from './user';

export interface IConfiguration {
    jd: {
        email: string,
        password: string,
    };
    jwt: {
        secret,
    };
    filePaths: {
        dir: string,
        tvDestination: string,
        movieDestination: string,
    };
    users: IUser[];
    iti: {
        host: string,
        user: string,
        pass: string,
    };
    plex: {
        dbLocation: string;
    };
    tmdb: {
        apiKey: string;
    };
}