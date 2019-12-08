import { Injectable } from '@nestjs/common';
import * as fs from 'fs-extra';
import * as parse from 'parse-torrent-name';
import * as path from 'path';
import * as rimraf from 'rimraf';
import { JdPackage } from '../models/jdownloader';
import { WsGateway } from '../ws/ws.gateway';

import {spawn} from 'child_process';
import { IConfiguration } from '../models/config';
import ConfigurationService from '../shared/configuration/configuration.service';

@Injectable()
export default class FileService {
    socket: WsGateway;
    config: IConfiguration;
    constructor(private readonly configService: ConfigurationService) {
        this.setConfiguration();
    }

    async setConfiguration() {
        this.config = await this.configService.getConfig();
    }

    setSocket(socket: WsGateway) {
        this.socket = socket;
    }

    async unrar(pkg: JdPackage): Promise<boolean> {
        this.config = await this.configService.getConfig();
        const packages = this.findRars(this.config.filePaths.dir, [pkg]);
        pkg = packages[0];
        return new Promise<boolean>((res, rej) => {

            try {
                const result = spawn(
                    'bash',
                    [
                        './unrar.sh',
                        pkg.files[0].fullDirectoryName,
                    ],
                    {
                        cwd: this.config.filePaths.dir,
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
        this.config = await this.configService.getConfig();
        packages = this.findVideos(this.config.filePaths.dir, packages);
        const moved = false;
        for (const j in packages) {
            if (packages[j]) {
                for (const i in packages[j].files) {
                    if (packages[j].files[i]) {
                        const file = packages[j].files[i];
                        if (file) {
                            const name = this.parseName(file.fileName);
                            let dir;
                            let dest;
                            if (name.isTv) {
                                dir = path.join(this.config.filePaths.tvDestination, name.title);
                                await fs.ensureDir(dir);
                                dest = path.join(dir, file.fileName);
                            } else {
                                dir = this.config.filePaths.movieDestination;
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
            }
        }

        return [true, packages];
    }

    async cleanUp(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            // rimraf(this.config.filePaths.dir + '/*', () => resolve(true));
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

    private findVideos(filePath: string, packages: JdPackage[]) {
        const files = this.getFiles(filePath).filter(f =>
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

    private findRars(filePath: string, packages: JdPackage[]) {
        const files = this.getFiles(filePath).filter(f =>
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

    private getFiles(dir, files_: File[] = []){
        const files = fs.readdirSync(dir);
        for (const i in files){
            if (files[i]) {
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
