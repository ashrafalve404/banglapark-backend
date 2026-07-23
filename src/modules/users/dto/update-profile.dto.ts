import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
    @ApiPropertyOptional({ example: 'Rahim Uddin' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    name?: string;

    @ApiPropertyOptional({ example: 'NewPass@123', minLength: 8 })
    @IsOptional()
    @IsString()
    @MinLength(8)
    password?: string;

    @ApiPropertyOptional({ example: 'http://localhost:4000/uploads/avatar.jpg' })
    @IsOptional()
    @IsString()
    profileImage?: string;
}
