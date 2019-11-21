import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { IUser } from '../models/user';
import { UserLevel } from '../shared/constants';
import { Roles, RolesGuard } from './auth.roles';
import { AuthService } from './auth.service';
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
