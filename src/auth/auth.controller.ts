import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { iUser } from '../models/user';
import { UserLevel } from '../shared/constants';
import { Roles, RolesGuard } from './auth.roles';
import { AuthService } from './auth.service';
import { EmailService } from 'shared/email/email.service';
@UseGuards(RolesGuard)
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService, private readonly emailService: EmailService) {}

    @Roles(UserLevel.Guest)
    @Post('token')
    async token(@Body() user: iUser): Promise<string> {
        return await this.authService.requestToken(user);

    }

    async sendVerificationEmail(): Promise<any> {
        return await this.emailService.sendVerificationEmail();
    }
}
