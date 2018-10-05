import * as fs from 'fs-extra';
import * as parse from 'parse-torrent-name';
import { Injectable } from '@nestjs/common';

@Injectable()
export default class FileService {

    dir = '/media/strong/User/Downloads/';
    tvDestination = '/media/strong/User/Videos/TV Shows/';
    movieDestination = '/media/strong/User/Videos/Movies/';

    async moveVideos() {  
        var files = this.getFiles(this.dir);
        for(var i in files) {
            var file = files[i];
            var name = this.parseName(file);
            if (name.isVideo) {
                if (name.isTv) {
                    await fs.ensureDir(this.tvDestination + name.title + '/');                    
                    console.log('moved ' + file + ' to TV Shows');
                    fs.move(file, this.tvDestination + name.title + '/');
                } else {
                    console.log('moved ' + file + ' to Movies');
                    fs.move(file, this.movieDestination);
                }
            }
        }
    }


    parseName(fileName: string) {
        const parsed = parse(fileName);
        let match = fileName.match(/.*\.(avi|AVI|wmv|WMV|flv|FLV|mpg|MPG|mp4|MP4)/);
        parsed.isVideo = match != null;
        parsed.isTv = parsed.season || parsed.episode;
        return parse(fileName);
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