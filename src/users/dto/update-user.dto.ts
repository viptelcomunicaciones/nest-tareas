import {
  IsString,
  IsOptional,
  IsEnum,
  IsEmail,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Rol } from '../../generated/prisma/enums';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  nombre?: string;

  @ApiPropertyOptional({ example: 'newemail@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ enum: Rol })
  @IsEnum(Rol)
  @IsOptional()
  rol?: Rol;
}

export class ChangePasswordDto {
  @ApiPropertyOptional({ example: 'currentPassword123' })
  @IsString()
  @MinLength(8)
  currentPassword: string;

  @ApiPropertyOptional({ example: 'newPassword123' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
