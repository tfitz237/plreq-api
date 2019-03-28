import {
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsResponse,
    OnGatewayInit,
    OnGatewayConnection,
  } from '@nestjs/websockets';
import { JdService } from '../jd/jd.service';
import FileService from '../jd/file.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { jdPackage } from '../models/jdownloader';
import { guid, UserLevel, AuthService } from '../auth/auth.service';
import PlexDb from '../plex/plex.db';
import { iUser } from '../models/user';
import axios from '../tmdb/tmdb.api';

@WebSocketGateway()
export class WsGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer() server;
  clients: any = [];

  authorizedGuid: string;

  constructor(private jdService: JdService, 
    private fileService: FileService, 
    private authService: AuthService, 
    private jwtStrategy: JwtStrategy, 
    private plexDb: PlexDb) {
      this.authorizedGuid = guid();
  }

  afterInit(server) {
    this.jdService.setSocket(this);
    this.plexDb.setSocket(this);
    this.fileService.setSocket(this);
  }

  @SubscribeMessage('authorization')
  async authorizeUser(client, token) {
    const decoded = await this.jwtStrategy.verifyJwt(token) as iUser;
    if (decoded && decoded.level > UserLevel.Guest) {
      client.authorized = true;
      client.user = decoded;
      client.join(this.authorizedGuid);
      return true;
    }
    else {
      return false;
    }
    
  }

  @SubscribeMessage('logout')
  async logout(client) {
    client.leave(this.authorizedGuid);
  }

  handleConnection(client) {
    this.clients.push(client);
  }
  
  @SubscribeMessage('packages')
  async getPackages(client, data): Promise<jdPackage[]> {
    if (client.authorized) {
      return await this.jdService.getPackages(false, null, false) as jdPackage[];
    }
  }

  @SubscribeMessage('isInPlex')
  async tvShowExists(client, data): Promise<any> {
    if (client.authorized) {
      if (data.type == 'TV') {
        return await this.plexDb.getTvEpisodes(data.name, data.season, data.episode);
      }
      if (data.type == 'Movies') {
        return await this.plexDb.getMovie(data.name);
      }
    }
  }

  @SubscribeMessage('createUser')
  async createUser(client, data: iUser): Promise<boolean> {
    return await this.authService.createUser(data);
  }

  @SubscribeMessage('requestImage')
  async requestImageMessage(client, data): Promise<any> {
    if (client.authorized) {
      return await this.requestImage(data);
    }
  }

  async requestImage(link: string) {
    const response = await axios.get(link, {responseType: 'arraybuffer' });
    const data = "data:" + response.headers["content-type"] + ";base64," + new Buffer(response.data).toString('base64');
    return data;
  } 

}