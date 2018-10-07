import * as fs from 'fs-extra';
import * as parse from 'parse-torrent-name';
import { Injectable } from '@nestjs/common';
import * as path from 'path';
import Configuration from 'shared/configuration';
@Injectable()
export default class FileService {
    dir: string;
    tvDestination: string;
    movieDestination: string;

    constructor() {
        const config = new Configuration().filePaths;
        this.dir = config.dir;
        this.tvDestination = config.tvDestination;
        this.movieDestination = config.movieDestination;

    }
    

    async moveVideos(): Promise<[boolean, boolean]> {  
        var files = this.getFiles(this.dir);
        let moved = false;
        for(var i in files) {
            var file = files[i];
            var name = this.parseName(path.basename(file));
            console.log(name, file);
            if (name.isVideo) {
                let dir;
                let dest;
                if (name.isTv) {
                    dir = path.join(this.tvDestination, name.title);
                    await fs.ensureDir(dir);                    
                    dest = path.join(dir, path.basename(file));

                } else {
                    dir = this.movieDestination;
                    dest = path.join(dir, path.basename(file));
                }
                try {
                    await fs.move(file, dest);
                    moved = true;
                    console.log(`moved ${file} to ${dest}`);
                } catch(err) {
                    console.error(err);
                    return [false, moved];
                }
            }
        }

        return [true,moved];
    }


    parseName(fileName: string) {
        const parsed = parse(fileName);
        let match = fileName.match(/.*\.(avi|AVI|wmv|WMV|flv|FLV|mpg|MPG|mp4|MP4|mkv|MKV|mpeg|MPEG)/);
        parsed.isVideo = match != null;
        parsed.isTv = (parsed.season || parsed.episode) !== undefined;
        return parsed;
    }


    private getFiles(dir, files_ = []){
        var files = fs.readdirSync(dir);
        for (var i in files){
            var name = dir + '/' + files[i];
            if (fs.statSync(name).isDirectory()){
                this.getFiles(name, files_);
            } else {
                files_.push(name);
            }
        }
        return files_;
    }
}