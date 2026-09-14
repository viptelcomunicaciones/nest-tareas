import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto, FilterTaskDto } from './dto/task.dto';
import { EstadoTarea } from '../generated/prisma/enums';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTaskDto: CreateTaskDto, usuarioId: number) {
    return this.prisma.tarea.create({
      data: {
        ...createTaskDto,
        usuarioId,
      },
      include: {
        usuario: {
          select: {
            id: true,
            email: true,
            nombre: true,
          },
        },
      },
    });
  }

  async findAll(usuarioId: number, rol: string, filterDto?: FilterTaskDto) {
    const where: any = {};

    if (rol !== 'ADMIN') {
      where.usuarioId = usuarioId;
    }

    if (filterDto?.estado) {
      where.estado = filterDto.estado;
    }

    if (filterDto?.prioridad) {
      where.prioridad = filterDto.prioridad;
    }

    return this.prisma.tarea.findMany({
      where,
      include: {
        usuario: {
          select: {
            id: true,
            email: true,
            nombre: true,
          },
        },
      },
      orderBy: { creadoEn: 'desc' },
    });
  }

  async findOne(id: number, usuarioId: number, rol: string) {
    const tarea = await this.prisma.tarea.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            id: true,
            email: true,
            nombre: true,
          },
        },
      },
    });

    if (!tarea) {
      throw new NotFoundException(`Tarea con ID ${id} no encontrada`);
    }

    if (rol !== 'ADMIN' && tarea.usuarioId !== usuarioId) {
      throw new ForbiddenException(
        'Solo puedes ver tus propias tareas',
      );
    }

    return tarea;
  }

  async update(
    id: number,
    updateTaskDto: UpdateTaskDto,
    usuarioId: number,
    rol: string,
  ) {
    const tarea = await this.prisma.tarea.findUnique({
      where: { id },
    });

    if (!tarea) {
      throw new NotFoundException(`Tarea con ID ${id} no encontrada`);
    }

    if (rol !== 'ADMIN' && tarea.usuarioId !== usuarioId) {
      throw new ForbiddenException(
        'Solo puedes actualizar tus propias tareas',
      );
    }

    return this.prisma.tarea.update({
      where: { id },
      data: updateTaskDto,
      include: {
        usuario: {
          select: {
            id: true,
            email: true,
            nombre: true,
          },
        },
      },
    });
  }

  async remove(id: number, usuarioId: number, rol: string) {
    const tarea = await this.prisma.tarea.findUnique({
      where: { id },
    });

    if (!tarea) {
      throw new NotFoundException(`Tarea con ID ${id} no encontrada`);
    }

    if (rol !== 'ADMIN' && tarea.usuarioId !== usuarioId) {
      throw new ForbiddenException(
        'Solo puedes eliminar tus propias tareas',
      );
    }

    await this.prisma.tarea.delete({
      where: { id },
    });

    return { message: 'Tarea eliminada exitosamente' };
  }

  async getStats(usuarioId: number, rol: string) {
    const where: any = {};

    if (rol !== 'ADMIN') {
      where.usuarioId = usuarioId;
    }

    const [total, pendientes, enProgreso, completadas] = await Promise.all([
      this.prisma.tarea.count({ where }),
      this.prisma.tarea.count({
        where: { ...where, estado: EstadoTarea.PENDIENTE },
      }),
      this.prisma.tarea.count({
        where: { ...where, estado: EstadoTarea.EN_PROGRESO },
      }),
      this.prisma.tarea.count({
        where: { ...where, estado: EstadoTarea.COMPLETADA },
      }),
    ]);

    return {
      total,
      pendientes,
      enProgreso,
      completadas,
    };
  }
}
