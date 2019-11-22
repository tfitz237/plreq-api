import { Controller, Post, UseGuards, Body } from '@nestjs/common';
import { AuthService, UserLevel } from './auth.service';
import { EmailService} from '../shared/email/email.service';
import { iUser } from '../models/user';
import { RolesGuard, Roles } from './auth.roles';

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
