import ConfigurationService from './configuration.service';
import { async } from 'rxjs/internal/scheduler/async';

export const configProvider = {
    provide: 'CONFIG',
    useFactory: async (service: ConfigurationService) => {
        return await service.getConfig();
    },
    inject: [ConfigurationService]
};