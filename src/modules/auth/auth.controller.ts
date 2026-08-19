import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
    RegisterDto,
    LoginDto,
    VerifyEmailDto,
    ResendVerificationDto,
    RefreshTokenDto,
    ForgotPasswordDto,
    ResetPasswordDto,
} from './dto/auth.dto';

class GoogleLoginDto {
    @ApiProperty() @IsString() idToken: string;
}
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    @Throttle({ default: { ttl: 60000, limit: 5 } })
    @ApiOperation({ summary: 'Register a new user (free)' })
    @ApiResponse({ status: 201, description: 'User registered successfully' })
    @ApiResponse({ status: 409, description: 'Email or phone already in use' })
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Post('verify-email')
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { ttl: 60000, limit: 5 } })
    @ApiOperation({ summary: 'Verify user email with 6-digit OTP code' })
    verifyEmail(@Body() dto: VerifyEmailDto) {
        return this.authService.verifyEmail(dto);
    }

    @Post('resend-verification')
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { ttl: 60000, limit: 3 } })
    @ApiOperation({ summary: 'Resend 6-digit verification code to email' })
    resendVerification(@Body() dto: ResendVerificationDto) {
        return this.authService.resendVerification(dto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { ttl: 60000, limit: 5 } })
    @ApiOperation({ summary: 'Login and receive access + refresh tokens' })
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Post('google')
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { ttl: 60000, limit: 5 } })
    @ApiOperation({ summary: 'Login or register with Google' })
    googleLogin(@Body() dto: GoogleLoginDto) {
        return this.authService.googleLogin(dto.idToken);
    }
}
