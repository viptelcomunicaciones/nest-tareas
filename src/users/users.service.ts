import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.usuario.findMany({
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        creadoEn: true,
      },
    });
  }

  async findOne(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        creadoEn: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return usuario;
  }

  async update(id: number, updateUserDto: UpdateUserDto, currentUser: any) {
    if (currentUser.rol !== 'ADMIN' && currentUser.id !== id) {
      throw new ForbiddenException(
        'Solo puedes actualizar tu propio perfil',
      );
    }

    await this.findOne(id);

    return this.prisma.usuario.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        creadoEn: true,
      },
    });
  }

  async changePassword(
    id: number,
    currentPassword: string,
    newPassword: string,
    currentUser: any,
  ) {
    if (currentUser.id !== id) {
      throw new ForbiddenException(
        'Solo puedes cambiar tu propia contraseña',
      );
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      usuario.password,
    );

    if (!isPasswordValid) {
      throw new ForbiddenException('La contraseña actual es incorrecta');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.usuario.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return { message: 'Contraseña actualizada exitosamente' };
  }

  async remove(id: number) {
    await this.findOne(id);

    await this.prisma.usuario.delete({
      where: { id },
    });

    return { message: 'Usuario eliminado exitosamente' };
  }
}
