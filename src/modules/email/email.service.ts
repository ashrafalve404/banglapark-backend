import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private resend: Resend | null = null;
    private fromEmail: string;

    constructor(private readonly configService: ConfigService) {
        const apiKey = this.configService.get<string>('RESEND_API_KEY') || process.env.RESEND_API_KEY;
        this.fromEmail = this.configService.get<string>('RESEND_FROM_EMAIL') || process.env.RESEND_FROM_EMAIL || 'Bangla Park <onboarding@resend.dev>';

        if (apiKey) {
            this.resend = new Resend(apiKey);
            this.logger.log('Resend Email Service initialized.');
        } else {
            this.logger.warn('RESEND_API_KEY is missing. Email sending will be logged to console in dev mode.');
        }
    }

    async sendVerificationEmail(toEmail: string, name: string, otp: string): Promise<boolean> {
        const subject = `${otp} is your Bangla Park Verification Code`;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Email Verification</title>
                <style>
                    body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 0; }
                    .container { max-width: 550px; margin: 30px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
                    .header { background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%); color: #ffffff; padding: 28px text-align: center; }
                    .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
                    .content { padding: 32px 28px; text-align: center; color: #334155; }
                    .greeting { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
                    .desc { font-size: 14px; line-height: 1.6; color: #64748b; margin-bottom: 24px; }
                    .otp-box { background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; display: inline-block; margin: 16px 0; }
                    .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #b91c1c; font-family: monospace; }
                    .expiry { font-size: 12px; color: #94a3b8; margin-top: 8px; }
                    .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Bangla Park Limited</h1>
                    </div>
                    <div class="content">
                        <div class="greeting">Hello ${name || 'User'},</div>
                        <div class="desc">
                            Thank you for registering with Bangla Park Limited! Please use the 6-digit verification code below to complete your account registration:
                        </div>
                        <div class="otp-box">
                            <div class="otp-code">${otp}</div>
                            <div class="expiry">Valid for 15 minutes</div>
                        </div>
                        <div class="desc" style="margin-top: 20px; font-size: 13px;">
                            If you did not request this account registration, please ignore this email.
                        </div>
                    </div>
                    <div class="footer">
                        &copy; ${new Date().getFullYear()} Bangla Park Limited. All rights reserved.
                    </div>
                </div>
            </body>
            </html>
        `;

        if (!this.resend) {
            this.logger.warn(`[DEV LOG] Verification email to ${toEmail} | OTP: ${otp}`);
            return true;
        }

        try {
            const res = await this.resend.emails.send({
                from: this.fromEmail,
                to: [toEmail],
                subject,
                html,
            });

            if (res.error) {
                this.logger.error(`Resend API Error sending to ${toEmail}:`, res.error);
                return false;
            }

            this.logger.log(`Verification email sent successfully to ${toEmail} (Message ID: ${res.data?.id})`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send verification email to ${toEmail}:`, error);
            return false;
        }
    }
}
