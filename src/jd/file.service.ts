import * as fs from 'fs-extra';
import * as parse from 'parse-torrent-name';
import { Injectable } from '@nestjs/common';
import * as path from 'path';
import Configuration from '../shared/configuration/configuration';
import * as rimraf from 'rimraf';
import { WsGateway } from '../ws/ws.gateway';
import { JdPackage } from '../models/jdownloader';

import {spawn} from 'child_process';

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

    async unrar(pkg: JdPackage): Promise<boolean> {
        const packages = this.findRars([pkg]);
        pkg = packages[0];
        return new Promise<boolean>((res, rej) => {

            try {
                const result = spawn(
                    'bash',
                    ['/media/strong/User/Projects/plreq-api/unrar.sh', pkg.files[0].fullDirectoryName],
                    {
                        cwd: '/media/large/User/Downloads',
                    },
                    );
                let resultString = '';
                result.stdout.on('data', data => resultString += data.toString());
                result.stderr.on('data', data => resultString += data.toString());

                result.on('close', () => {
                    console.log(resultString);
                    res(resultString.includes('Success'));
                });
            }
            catch (e) {
                console.log(e);
                res(false);
            }
        });
    }

    async moveVideos(packages: JdPackage[] = []): Promise<[boolean, JdPackage[]]> {
        packages = this.findVideos(packages);
        const moved = false;
        for (const j in packages) {
            for (const i in packages[j].files) {
                const file = packages[j].files[i];
                if (file) {
                    const name = this.parseName(file.fileName);
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
                            await fs.move(file.fullPath, dest, { overwrite: true});
                            packages[j].files[i].moved = true;
                            console.log(`moved ${file.fileName} to ${dest}`);
                        }
                    } catch (err) {
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
            // rimraf(this.dir + '/*', () => resolve(true));
            resolve(true);
	});

    }

    parseName(fileName: string) {
        const parsed = parse(fileName);
        const match = fileName.match(/.*\.(avi|AVI|wmv|WMV|flv|FLV|mpg|MPG|mp4|MP4|mkv|MKV|mpeg|MPEG)/);
        parsed.isArchive = fileName.match(/.*\.rar/) != null;
        parsed.isVideo = match != null;
        parsed.isTv = (parsed.season || parsed.episode) !== undefined;
        return parsed;
    }

    private findVideos(packages: JdPackage[]) {
        const files = this.getFiles().filter(f =>
            this.parseName(f.fileName).isVideo,
        );
        packages.forEach(p => {
            p.files = files.filter(x => {
                let count = 0;
                const words = x.directoryName.split(' ');
                const threshold = Math.floor(words.length / 2);
                words.forEach(word => {
                    if (p.name.includes(word)) {
                        count++;
                    }
                });

                return count >= threshold;
            });
        });

        return packages;
    }

    private findRars(packages: JdPackage[]) {
        const files = this.getFiles().filter(f =>
            this.parseName(f.fileName).isArchive,
        );
        packages.forEach(p => {
            p.files = files.filter(x => {
                let count = 0;
                const words = x.directoryName.split(' ');
                const threshold = Math.floor(words.length / 2);
                words.forEach(word => {
                    if (p.name.includes(word)) {
                        count++;
                    }
                });

                return count >= threshold;
            });
        });

        return packages;
    }

    private getFiles(dir = this.dir, files_: File[] = []){
        const files = fs.readdirSync(dir);
        for (const i in files){
            const name = dir + '/' + files[i];
            if (fs.statSync(name).isDirectory()){
                this.getFiles(name, files_);
            } else {
                const dirs = path.dirname(name).split(path.sep);
                files_.push({
                    fileName: path.basename(name),
                    fullPath: name,
                    directoryName: dirs[dirs.length - 1].replace(/[\-_\[\]\(\)]+/, ''),
                    fullDirectoryName: dirs[dirs.length - 1],
                    moved: false,
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
    fullDirectoryName: string;
    destination?: string;
    moved: boolean;
}
