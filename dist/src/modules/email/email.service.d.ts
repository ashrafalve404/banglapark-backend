import { ConfigService } from '@nestjs/config';
export declare class EmailService {
    private readonly configService;
    private readonly logger;
    private resend;
    private fromEmail;
    constructor(configService: ConfigService);
    sendVerificationEmail(toEmail: string, name: string, otp: string): Promise<boolean>;
}
