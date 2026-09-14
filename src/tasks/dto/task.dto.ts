import {
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoTarea, Prioridad } from '../../generated/prisma/enums';

export class CreateTaskDto {
  @ApiProperty({ example: 'Comprar víveres' })
  @IsString()
  @MinLength(1)
  titulo: string;

  @ApiPropertyOptional({ example: 'Leche, huevos, pan' })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiPropertyOptional({ enum: EstadoTarea, default: EstadoTarea.PENDIENTE })
  @IsEnum(EstadoTarea)
  @IsOptional()
  estado?: EstadoTarea;

  @ApiPropertyOptional({ enum: Prioridad, default: Prioridad.MEDIA })
  @IsEnum(Prioridad)
  @IsOptional()
  prioridad?: Prioridad;
}

export class UpdateTaskDto {
  @ApiPropertyOptional({ example: 'Comprar víveres' })
  @IsString()
  @MinLength(1)
  @IsOptional()
  titulo?: string;

  @ApiPropertyOptional({ example: 'Leche, huevos, pan' })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiPropertyOptional({ enum: EstadoTarea })
  @IsEnum(EstadoTarea)
  @IsOptional()
  estado?: EstadoTarea;

  @ApiPropertyOptional({ enum: Prioridad })
  @IsEnum(Prioridad)
  @IsOptional()
  prioridad?: Prioridad;
}

export class FilterTaskDto {
  @ApiPropertyOptional({ enum: EstadoTarea })
  @IsEnum(EstadoTarea)
  @IsOptional()
  estado?: EstadoTarea;

  @ApiPropertyOptional({ enum: Prioridad })
  @IsEnum(Prioridad)
  @IsOptional()
  prioridad?: Prioridad;
}
