import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
// bcrypt: librería para hashear contraseñas de forma segura (irreversible)
import * as bcrypt from 'bcrypt';
// crypto: módulo nativo de Node para generar tokens aleatorios y hashes
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';

// @Injectable() marca esta clase como un "servicio" que NestJS puede inyectar en otros lugares
@Injectable()
export class AuthService {
  // NestJS inyecta automáticamente PrismaService (acceso a BD) y JwtService (crear/verificar tokens)
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signUp(dto: SignUpDto) {
    // Busca si ya existe un usuario con ese email en la BD
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    // 409 Conflict: no se puede registrar un email que ya existe
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // Busca el rol "client" en la BD; si no existe, lo crea (patrón "find or create")
    let clientRole = await this.prisma.role.findUnique({
      where: { name: 'client' },
    });
    if (!clientRole) {
      clientRole = await this.prisma.role.create({ data: { name: 'client' } });
    }

    // Hashea la contraseña con bcrypt (10 rondas de salt = nivel de complejidad del hash)
    const passwordHash = await bcrypt.hash(dto.password, 10);
    // Crea el usuario en la BD; include: { role: true } trae también los datos del rol relacionado
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        roleId: clientRole.id,
      },
      include: { role: true },
    });

    // Genera un JWT y devuelve el token + datos públicos del usuario
    const token = this.generateToken(user.id, user.email, user.role.name);
    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
      },
    };
  }

  async signIn(dto: SignInDto) {
    // Busca el usuario por email e incluye su rol
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: true },
    });

    // Si no existe o está inactivo, rechaza (mismo mensaje para no revelar cuál falló)
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Invalid credentials');
    }

    // bcrypt.compare compara la contraseña en texto plano con el hash almacenado
    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user.id, user.email, user.role.name);
    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
      },
    };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Siempre devuelve el mismo mensaje para evitar que un atacante sepa si el email existe
    if (!user) return { message: 'If the email exists, a reset link was sent' };

    // Genera 32 bytes aleatorios como token y los convierte a texto hexadecimal
    const rawToken = crypto.randomBytes(32).toString('hex');
    // Hashea el token con SHA-256 antes de guardarlo (así la BD nunca tiene el token real)
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Guarda el hash del token en la BD con expiración de 1 hora
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hora
      },
    });

    // TODO: send email with rawToken via queue
    return { message: 'If the email exists, a reset link was sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    // Hashea el token recibido para compararlo con el que está guardado en la BD
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    // Rechaza si: no existe, ya fue usado, o ya expiró
    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired token');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    // $transaction ejecuta ambas operaciones juntas: si una falla, se revierten ambas
    await this.prisma.$transaction([
      // Actualiza la contraseña del usuario
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash, passwordChangedAt: new Date() },
      }),
      // Marca el token como usado para que no se pueda reutilizar
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    // TODO: send password-changed notification email via queue
    return { message: 'Password reset successfully' };
  }

  // Genera un JWT con el id (sub = "subject"), email y rol del usuario como payload
  private generateToken(userId: number, email: string, role: string): string {
    return this.jwtService.sign({ sub: userId, email, role });
  }
}
