import { Controller, Request, Post, UseGuards, Body, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login(@Request() req) {
        return this.authService.login(req.user);
    }

    @Post('register')
    async register(@Body() createUserDto: CreateUserDto) {
        return this.authService.register(createUserDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@Request() req) {
        return req.user;
    }

    @UseGuards(JwtAuthGuard)
    @Post('change-password')
    async changePassword(
        @Request() req,
        @Body() body: { oldPassword: string; newPassword: string }
    ) {
        return this.authService.changePassword(req.user.id, body.oldPassword, body.newPassword);
    }

    @Post('reset-password')
    async resetPassword(
        @Body() body: { email: string; phone: string; newPassword: string }
    ) {
        return this.authService.resetPassword(body.email, body.phone, body.newPassword);
    }
}

