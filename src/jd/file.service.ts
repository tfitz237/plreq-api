import * as fs from 'fs-extra';
import * as parse from 'parse-torrent-name';
import { Injectable } from '@nestjs/common';
import * as path from 'path';
import Configuration from '../shared/configuration';
import * as rimraf from 'rimraf';
import { WsGateway } from '../ws/ws.gateway';
import { jdPackage } from '../models/jdownloader';
@Injectable()
export default class FileService {
    dir: string;
    tvDestination: string;
    movieDestination: string;
    socket: WsGateway;

    constructor(private readonly config: Configuration) {
        this.setConfiguration();
    }
    
    setConfiguration() {
        this.dir = this.config.filePaths.dir;
        this.tvDestination = this.config.filePaths.tvDestination;
        this.movieDestination = this.config.filePaths.movieDestination;
    }

    setSocket(socket: WsGateway) {
        this.socket = socket;
    }
    

    async moveVideos(packages: jdPackage[] = []): Promise<[boolean, jdPackage[]]> {  
        packages = this.findVideos(packages);
        let moved = false;
        for(var j in packages) {
            for (var i in packages[j].files) {
                var file = packages[j].files[i];
                if (file) {
                    var name = this.parseName(file.fileName);
                    let dir;
                    let dest;
                    if (name.isTv) {
                        dir = path.join(this.tvDestination, name.title);
                        await fs.ensureDir(dir);                    
                        dest = path.join(dir, file.fileName);
                    } else {
                        dir = this.movieDestination;
                        dest = path.join(dir, file.fileName);
                    }
                    try {

                        packages[j].files[i].destination = dest;
                        
                        if (!file.moved) {
                            await fs.move(file.fullPath, dest);
                            packages[j].files[i].moved = true;
                            console.log(`moved ${file.fileName} to ${dest}`);
                        }
                    } catch(err) {
                        console.error(err);
                        return [false, packages];
                    }
                }
            }     
        }

        return [true, packages];
    }

    async cleanUp(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            rimraf(this.dir + '/*', () => resolve(true));
        });
        
    }

    parseName(fileName: string) {
        const parsed = parse(fileName);
        let match = fileName.match(/.*\.(avi|AVI|wmv|WMV|flv|FLV|mpg|MPG|mp4|MP4|mkv|MKV|mpeg|MPEG)/);
        parsed.isVideo = match != null;
        parsed.isTv = (parsed.season || parsed.episode) !== undefined;
        return parsed;
    }

    private findVideos(packages: jdPackage[]) {
        let files = this.getFiles().filter(f => 
            this.parseName(f.fileName).isVideo
        );
        packages.forEach(p => {
            p.files = files.filter(x => x.directoryName.includes(p.name));
        });

        return packages;
    }
    private getFiles(dir = this.dir, files_: File[] = []){
        var files = fs.readdirSync(dir);
        for (var i in files){
            var name = dir + '/' + files[i];
            if (fs.statSync(name).isDirectory()){
                this.getFiles(name, files_);
            } else {
                const dirs = path.dirname(name).split(path.sep);
                files_.push({
                    fileName: path.basename(name),
                    fullPath: name,
                    directoryName: dirs[dirs.length - 1].replace(/[\-_\[\]\(\)]+/, ''),
                    moved: false
                });
            }
        }
        return files_;
    }


}

export interface File {
    fileName: string;
    fullPath: string;
    directoryName: string;
    destination?: string;
    moved: boolean;
}