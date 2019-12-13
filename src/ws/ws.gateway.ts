import {
    OnGatewayConnection,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsResponse,
  } from '@nestjs/websockets';
import axios from 'axios';
import { AuthService, guid } from '../auth/auth.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import FileService from '../jd/file.service';
import { JdService } from '../jd/jd.service';
import { JdPackage } from '../models/jdownloader';
import { IUser } from '../models/user';
import PlexDb from '../plex/plex.db';
import { UserLevel } from '../shared/constants';
import { Logger } from '../shared/log/log.service';
import { LogEntry, LogLevel } from '../shared/log/log.entry.entity';
import { Server } from 'socket.io';
@WebSocketGateway()
export class WsGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer() server: Server;
  clients: any = [];
  guids: {[level: number]: string } = {};
  adminGuid: string;
  constructor(private jdService: JdService,
              private fileService: FileService,
              private authService: AuthService,
              private jwtStrategy: JwtStrategy,
              private plexDb: PlexDb,
              private logger: Logger) {

  }

  afterInit(server) {
    this.jdService.setSocket(this);
    this.plexDb.setSocket(this);
    this.fileService.setSocket(this);
    this.logger.setSocket(this);
  }

  generateChannels() {
    this.guids[UserLevel.User] = guid();
    this.guids[UserLevel.ItiUser] = guid();
    this.guids[UserLevel.Admin] = guid();
    this.guids[UserLevel.SuperAdmin] = guid();
  }

  @SubscribeMessage('authorization')
  async authorizeUser(client, token) {
    const decoded = await this.jwtStrategy.verifyJwt(token) as IUser;
    if (decoded && decoded.level > UserLevel.Guest) {
      return this.joinChannels(client, decoded);
    } else {
      return false;
    }
  }

  @SubscribeMessage('logout')
  async logout(client) {
    this.leaveChannels(client);
  }

  handleConnection(client) {
    this.clients.push(client);
  }

  sendEvent(event: string, data: any, userLevel: UserLevel) {
    if (userLevel > UserLevel.Guest) {
      this.server.to(this.guids[userLevel]).emit(event, data);
    } else {
      this.server.emit(event, data);
    }
  }

  @SubscribeMessage('packages')
  async getPackages(client, data): Promise<JdPackage[]> {
    if (client.authorized) {
      return await this.jdService.getPackages(false, null, false) as JdPackage[];
    }
  }

  @SubscribeMessage('isInPlex')
  async tvShowExists(client, data): Promise<any> {
    if (client.authorized) {
      if (data.type === 'TV') {
        return await this.plexDb.getTvEpisodes(data.name, data.season, data.episode);
      }
      if (data.type === 'Movies') {
        return await this.plexDb.getMovie(data.name);
      }
    }
  }

  @SubscribeMessage('createUser')
  async createUser(client, data: IUser): Promise<boolean> {
    return await this.authService.createUser(data);
  }

  @SubscribeMessage('requestImage')
  async requestImageMessage(client, data): Promise<any> {
    if (client.authorized) {
      return await this.requestImage(data);
    }
  }

  private joinChannels(client, user) {
    client.authorized = true;
    client.user = user;
    for (const i in UserLevel) {
      if (this.guids[i] && user.level >= i) {
        client.join(this.guids[i]);
      }
    }
  }
  private leaveChannels(client) {
    client.authorized = false;
    for (const i in UserLevel) {
      if (this.guids[i] && client.user.level >= i) {
        client.leave(this.guids[i]);
      }
    }
    client.user = undefined;
  }
  private async requestImage(link: string) {
    const response = await axios.get(link, {responseType: 'arraybuffer' });
    const data = 'data:' + response.headers['content-type'] + ';base64,' + new Buffer(response.data).toString('base64');
    return data;
  }

}