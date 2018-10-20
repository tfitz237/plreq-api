import {
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsResponse,
    OnGatewayInit,
    OnGatewayConnection,
  } from '@nestjs/websockets';
  import { from, Observable } from 'rxjs';
  import { map } from 'rxjs/operators';
import { Injectable } from '@nestjs/common';
import { JdService } from '../jd/jd.service';
import FileService from '../jd/file.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { jdPackage } from '../models/jdownloader';
import { guid } from '../auth/auth.service';

  @WebSocketGateway()
  export class WsGateway implements OnGatewayInit, OnGatewayConnection {
    @WebSocketServer() server;
    clients: any = [];

    authorizedGuid: string;

    constructor(private jdService: JdService, private fileService: FileService, private jwtStrategy: JwtStrategy) {
        this.authorizedGuid = guid();
    }

    afterInit(server) {
      this.jdService.setSocket(this);
      this.fileService.setSocket(this);
    }

    @SubscribeMessage('authorization')
    async authorizeUser(client, token) {
      const decoded = await this.jwtStrategy.verifyJwt(token);
      if (decoded) {
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
  
  }