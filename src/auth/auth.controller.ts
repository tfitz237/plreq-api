import { Controller, Post, UseGuards, Body } from '@nestjs/common';
import { AuthService, UserLevel } from './auth.service';
import { IUser } from '../models/user';
import { RolesGuard, Roles } from './auth.roles';

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
