import { Controller, Post, UseGuards, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { iUser } from '../models/user';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('token')
    async token(@Body() user: iUser): Promise<string> {
        return await this.authService.requestToken(user);
        
    }
    
}
