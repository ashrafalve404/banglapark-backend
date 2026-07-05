import {
    Controller, Post, UseInterceptors, UploadedFile, BadRequestException, Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import type { Request } from 'express';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024;

function uploadDir(): string {
    return process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
}

@Controller('uploads')
export class UploadsController {
    @Post()
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: (_req: any, _file: any, cb: any) => cb(null, uploadDir()),
                filename: (_req: any, file: any, cb: any) => {
                    const ext = extname(file.originalname);
                    cb(null, `${randomUUID()}${ext}`);
                },
            }),
            limits: { fileSize: MAX_SIZE },
            fileFilter: (_req: any, file: any, cb: any) => {
                if (!ALLOWED_TYPES.includes(file.mimetype)) {
                    return cb(new BadRequestException('Only JPG, PNG, WebP & GIF allowed'), false);
                }
                cb(null, true);
            },
        }),
    )
    upload(@UploadedFile() file: any, @Req() req: Request) {
        if (!file) throw new BadRequestException('File is required');
        const protocol = req.protocol;
        const host = req.get('host');
        return { url: `${protocol}://${host}/uploads/${file.filename}` };
    }
}
