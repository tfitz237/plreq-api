import * as fs from 'fs-extra';
import * as parse from 'parse-torrent-name';
import { Injectable } from '@nestjs/common';
import * as path from 'path';
import Configuration from './configuration';
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
    

    async moveVideos() {  
        var files = this.getFiles(this.dir);
        for(var i in files) {
            var file = files[i];
            var name = this.parseName(path.basename(file));
            if (name.isVideo) {
                if (name.isTv) {
                    const dir = path.join(this.tvDestination, name.title);
                    await fs.ensureDir(dir);                    
                    
                    fs.move(file, path.join(dir, path.basename(file))).then(() => {
                        console.log('moved ' + file + ' to TV Shows');
                    }).catch((err) => {
                        console.error(err);
                    });;
                } else {
                    const dir = this.movieDestination;
                    fs.move(file, path.join(dir, path.basename(file))).then(() => {
                        console.log('moved ' + file + ' to Movies');
                    }).catch((err) => {
                        console.error(err);
                    });
                }
            }
        }
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