import {
    IsEmail,
    IsString,
    MinLength,
    IsOptional,
    MaxLength,
    Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({ example: 'Rahim Uddin' })
    @IsString()
    @MaxLength(100)
    name: string;

    @ApiProperty({ example: 'rahim@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: '+8801712345678' })
    @IsString()
    @Matches(/^\+?\d{7,15}$/, { message: 'Phone must be a valid number (7-15 digits, optional + prefix)' })
    phone: string;

    @ApiProperty({ example: 'StrongPass@123', minLength: 8 })
    @IsString()
    @MinLength(8)
    password: string;

    @ApiPropertyOptional({ example: 'REF-ABC123' })
    @IsOptional()
    @IsString()
    referralCode?: string;
}

export class LoginDto {
    @ApiProperty({ example: 'rahim@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'StrongPass@123' })
    @IsString()
    password: string;
}

export class RefreshTokenDto {
    @ApiProperty()
    @IsString()
    refreshToken: string;
}

export class ForgotPasswordDto {
    @ApiProperty({ example: 'rahim@example.com' })
    @IsEmail()
    email: string;
}

export class ResetPasswordDto {
    @ApiProperty()
    @IsString()
    token: string;

    @ApiProperty({ minLength: 8 })
    @IsString()
    @MinLength(8)
    newPassword: string;
}
