import { Controller, Post, UseGuards, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { IUser } from '../models/user';
import { RolesGuard, Roles } from './auth.roles';
import { UserLevel } from '../shared/constants';
@UseGuards(RolesGuard)
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Roles(UserLevel.Guest)
    @Post('token')
    async token(@Body() user: IUser): Promise<string> {
        return await this.authService.requestToken(user);

    }

}
