import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Configuration } from './configuration.entity';
import { IConfiguration } from '../../models/config';


@Injectable()
export default class ConfigurationService {
    entries: Configuration[];
    config: any = {};
    constructor(private readonly configRepo: Repository<Configuration>)
    {}

    async retrieveAll() {
        this.entries = await this.configRepo.find();
        this.entries.forEach(entry => {
            let key = entry.key;

            this.config[entry.key] = entry.value;
        });
    }

    async setValue(key: string, value: any, save: boolean = false) {
        this.config[key] = value;
        if (save) {
            const entry = await this.configRepo.findOne({key});
            entry.value = value;
            this.configRepo.save(entry)
        }
    }
}
