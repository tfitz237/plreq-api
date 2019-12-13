import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IConfiguration } from '../../models/config';
import { JSONtryParse } from '../functions';
import Configurations from './configuration.entity';
// tslint:disable-next-line: no-var-requires
const merge = require('deepmerge');

@Injectable()
export default class ConfigurationService {
    entries: Configurations[];
    _config: any = {};
    constructor(@InjectRepository(Configurations) private readonly configRepo: Repository<Configurations>)
    {
    }

    async getConfig(): Promise<IConfiguration> {
        if (Object.keys(this._config).length > 0) {
            return this._config;
        }
        return await this.retrieveAll();
    }
    async retrieveAll() {
        this.entries = await this.configRepo.find();
        this.entries.forEach(entry => {
            const keyval = this.makeKeyValuePair(entry.key, entry.value);
            this._config = merge(this._config, keyval);
        });
        return this._config;
    }

    async setValue(key: string, value: any, save: boolean = false) {
        this._config[key] = value;
        if (save) {
            const entry = await this.configRepo.findOne({key});
            entry.value = value;
            this.configRepo.save(entry);
        }
    }

    makeKeyValuePair(key: string, value: any): any {
        const keys = key.split('.');
        const result = {};
        let currentKey = keys[0];
        result[currentKey] = {};
        let lastRecord = result[currentKey];
        if (keys.length > 1) {
            for (let i = 1; i < keys.length; i++) {
                currentKey = keys[i];
                lastRecord[currentKey] = i === keys.length - 1 ? JSONtryParse(value) : {};
                lastRecord = lastRecord[currentKey];
            }
        } else {
            lastRecord = value;
        }
        return result;
    }
}

