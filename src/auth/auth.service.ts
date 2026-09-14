import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, nombre } = registerDto;

    const existingUser = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const usuario = await this.prisma.usuario.create({
      data: {
        email,
        password: hashedPassword,
        nombre: nombre ?? '',
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        creadoEn: true,
      },
    });

    const tokens = await this.generateTokens(usuario.id, usuario.email);

    return {
      usuario,
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, usuario.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(usuario.id, usuario.email);

    return {
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
      },
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { usuario: true },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (new Date() > tokenRecord.expiraEn) {
      await this.prisma.refreshToken.delete({
        where: { id: tokenRecord.id },
      });
      throw new UnauthorizedException('Refresh token expired');
    }

    await this.prisma.refreshToken.delete({
      where: { id: tokenRecord.id },
    });

    const tokens = await this.generateTokens(
      tokenRecord.usuario.id,
      tokenRecord.usuario.email,
    );

    return {
      usuario: {
        id: tokenRecord.usuario.id,
        email: tokenRecord.usuario.email,
        nombre: tokenRecord.usuario.nombre,
        rol: tokenRecord.usuario.rol,
      },
      ...tokens,
    };
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  private async generateTokens(usuarioId: number, email: string) {
    const payload: JwtPayload = { sub: usuarioId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get<string>('JWT_EXPIRATION') ?? '15m',
      } as any),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn:
          this.configService.get<string>('JWT_REFRESH_EXPIRATION') ?? '24h',
      } as any),
    ]);

    await this.storeRefreshToken(refreshToken, usuarioId);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async storeRefreshToken(token: string, usuarioId: number) {
    const expirationHours = parseInt(
      this.configService.get<string>('JWT_REFRESH_EXPIRATION') ?? '24',
    );

    const expiraEn = new Date();
    expiraEn.setHours(expiraEn.getHours() + expirationHours);

    await this.prisma.refreshToken.create({
      data: {
        token,
        usuarioId,
        expiraEn,
      },
    });
  }
}
