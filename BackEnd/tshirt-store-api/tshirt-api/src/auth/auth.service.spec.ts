import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: Record<string, any>;

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
      role: { findUnique: jest.fn(), create: jest.fn() },
      passwordResetToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      refreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      notification: { create: jest.fn() },
      $transaction: jest.fn((calls) => Promise.all(calls)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('mock-jwt-token') },
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('signUp', () => {
    const dto = {
      email: 'test@example.com',
      password: 'Secret123!',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should create a new user and return a token', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.role.findUnique.mockResolvedValue({ id: 1, name: 'client' });
      prisma.user.create.mockResolvedValue({
        id: 1,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: { name: 'client' },
      });

      const result = await service.signUp(dto);

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe(dto.email);
      expect(result.user.role).toBe('client');
      expect(prisma.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 1,
            tokenHash: expect.any(String),
            expiresAt: expect.any(Date),
          }),
        }),
      );
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: dto.email,
            firstName: dto.firstName,
            lastName: dto.lastName,
            roleId: 1,
          }),
        }),
      );
    });

    it('should throw ConflictException if email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1, email: dto.email });

      await expect(service.signUp(dto)).rejects.toThrow(ConflictException);
    });

    it('should create the client role if it does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.role.findUnique.mockResolvedValue(null);
      prisma.role.create.mockResolvedValue({ id: 1, name: 'client' });
      prisma.user.create.mockResolvedValue({
        id: 1,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: { name: 'client' },
      });

      await service.signUp(dto);

      expect(prisma.role.create).toHaveBeenCalledWith({
        data: { name: 'client' },
      });
    });
  });

  describe('signIn', () => {
    const dto = { email: 'test@example.com', password: 'Secret123!' };

    it('should return a token for valid credentials', async () => {
      const hash = await bcrypt.hash(dto.password, 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: dto.email,
        passwordHash: hash,
        status: 'active',
        role: { name: 'client' },
        firstName: 'John',
        lastName: 'Doe',
      });

      const result = await service.signIn(dto);

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe(dto.email);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.signIn(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: dto.email,
        passwordHash: await bcrypt.hash('different-password', 10),
        status: 'active',
        role: { name: 'client' },
      });

      await expect(service.signIn(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for disabled user', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: dto.email,
        status: 'disabled',
        role: { name: 'client' },
      });

      await expect(service.signIn(dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should rotate a valid refresh token and return a new auth response', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 10,
        userId: 1,
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        user: {
          id: 1,
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          phone: null,
          status: 'active',
          role: { name: 'client' },
        },
      });

      const result = await service.refresh({
        refreshToken: 'valid-refresh-token-value',
      });

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { revokedAt: expect.any(Date) },
      });
      expect(prisma.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 1 }),
        }),
      );
    });

    it('should throw UnauthorizedException for expired refresh token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 10,
        userId: 1,
        revokedAt: null,
        expiresAt: new Date(Date.now() - 1000),
        user: { status: 'active', role: { name: 'client' } },
      });

      await expect(
        service.refresh({ refreshToken: 'expired-refresh-token-value' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('signOut', () => {
    it('should revoke the refresh token when one is provided', async () => {
      await service.signOut({ refreshToken: 'valid-refresh-token-value' });

      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { tokenHash: expect.any(String) },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe('forgotPassword', () => {
    it('should create a reset token for existing user', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
      });
      prisma.passwordResetToken.create.mockResolvedValue({});

      const result = await service.forgotPassword('test@example.com');

      expect(result.message).toContain('reset link was sent');
      expect(prisma.passwordResetToken.create).toHaveBeenCalled();
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          type: 'password_reset',
          recipientEmail: 'test@example.com',
        },
      });
    });

    it('should return same message for non-existent email (no enumeration)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword('nobody@example.com');

      expect(result.message).toContain('reset link was sent');
      expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should throw BadRequestException for invalid token', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue(null);

      await expect(
        service.resetPassword('bad-token', 'NewPassword1!'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for expired token', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 1,
        userId: 1,
        usedAt: null,
        expiresAt: new Date(Date.now() - 1000), // expired
        user: { email: 'test@example.com' },
      });

      await expect(
        service.resetPassword('expired-token', 'NewPassword1!'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for already used token', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 1,
        userId: 1,
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 60000),
        user: { email: 'test@example.com' },
      });

      await expect(
        service.resetPassword('used-token', 'NewPassword1!'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
