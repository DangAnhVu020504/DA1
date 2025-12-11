import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @IsNotEmpty()
    fullName: string;

    @IsOptional()
    phone?: string;

    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    // Note: passwordHash is handled by service, DTO takes raw password
    passwordHash?: string;
}
