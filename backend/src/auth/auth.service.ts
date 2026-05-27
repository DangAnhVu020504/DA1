import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findOneByEmail(email);
        if (user && user.passwordHash && (await bcrypt.compare(pass, user.passwordHash))) {
            const { passwordHash, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = { email: user.email, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async register(createUserDto: CreateUserDto) {
        const existingUser = await this.usersService.findOneByEmail(createUserDto.email);
        if (existingUser) {
            throw new UnauthorizedException('Email already exists');
        }
        const safeUserDto = { ...createUserDto, role: UserRole.CUSTOMER };
        const newUser = await this.usersService.create(safeUserDto);
        const { passwordHash, ...result } = newUser;
        return result;
    }

    async validateGoogleUser(profile: any) {
        let user = await this.usersService.findOneByEmail(profile.email);

        if (!user) {
            user = await this.usersService.createGoogleUser({
                email: profile.email,
                fullName: profile.fullName,
                avatar: profile.avatar,
                provider: profile.provider,
                providerId: profile.providerId,
            });
        }

        return this.login(user);
    }

    async changePassword(userId: number, oldPassword: string, newPassword: string) {
        const user = await this.usersService.findOne(userId);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Old password is incorrect');
        }

        const salt = await bcrypt.genSalt();
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        await this.usersService.updatePassword(userId, newPasswordHash);

        return { message: 'Password changed successfully' };
    }

    async resetPassword(email: string, phone: string, newPassword: string) {
        const user = await this.usersService.findOneByEmail(email);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        if (user.phone !== phone) {
            throw new UnauthorizedException('Phone number does not match');
        }

        const salt = await bcrypt.genSalt();
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        await this.usersService.updatePassword(user.id, newPasswordHash);

        return { message: 'Password reset successfully' };
    }
}
