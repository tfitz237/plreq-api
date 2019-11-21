export interface TmdbEpisode {
    air_date: string;
    episode_number: number;
    id: number;
    name: string;
    overview: string;
    production_code: null;
    season_number: number;
    show_id: number;
    still_path: string;
    vote_average: number;
    vote_count: number;
    crew: [
        {
            id: number,
            credit_id: string,
            name: string,
            department: string,
            job: string,
            gender: number,
            profile_path: null,
        }
    ];
    guest_stars: [
        {
            id: number,
            name: string,
            credit_id: string,
            character: string,
            order: number,
            gender: number,
            profile_path: string,
        }
    ];
}