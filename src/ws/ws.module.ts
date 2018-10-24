import { WsGateway } from "./ws.gateway";
import { Module } from "@nestjs/common";
import { JdModule } from "../jd/jd.module"
import { AuthModule } from "../auth/auth.module";
import { SharedModule } from "../shared/shared.module";
import { ItiModule } from "../iti/iti.module";
import { PlexModule } from "../plex/plex.module";



@Module({
    imports: [SharedModule, AuthModule, JdModule, ItiModule, PlexModule],
    providers: [WsGateway]
})
export class WsModule {}