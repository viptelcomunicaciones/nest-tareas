import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
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
}

export class UpdateRoleDto {
  @ApiPropertyOptional({ enum: Rol, example: Rol.ADMIN })
  @IsEnum(Rol)
  rol: Rol;
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
