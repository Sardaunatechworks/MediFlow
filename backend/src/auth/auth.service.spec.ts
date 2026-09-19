import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuditService } from '../audit/audit.service';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: any;
  let auditService: any;

  const mockPasswordHash = bcrypt.hashSync('Password123!', 10);

  const mockUser = {
    id: 'user-001',
    email: 'test@example.com',
    password: mockPasswordHash,
    name: 'Test Clinician',
    role: 'CLINICIAN',
    title: 'Dr.',
    facilityId: 'f1',
    isActive: true,
    facility: {
      id: 'f1',
      name: 'National Hospital Abuja',
      type: 'HOSPITAL',
      verificationStatus: 'VERIFIED',
      status: 'ACTIVE',
    },
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      facility: {
        findUnique: jest.fn(),
      },
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    auditService = {
      log: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should authenticate a user with correct credentials and issue JWT', async () => {
    prisma.user.findUnique.mockResolvedValue(mockUser);

    const result = await service.login({
      email: 'test@example.com',
      password: 'Password123!',
    });

    expect(result.accessToken).toBe('mock-jwt-token');
    expect(result.user.email).toBe('test@example.com');
    expect(result.user.role).toBe('CLINICIAN');
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'LOGIN_SUCCESS' }),
    );
  });

  it('should throw UnauthorizedException on invalid password and log audit event', async () => {
    prisma.user.findUnique.mockResolvedValue(mockUser);

    await expect(
      service.login({
        email: 'test@example.com',
        password: 'WrongPassword!',
      }),
    ).rejects.toThrow(UnauthorizedException);

    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'LOGIN_FAILED' }),
    );
  });

  it('should throw ConflictException on register if email already exists', async () => {
    prisma.user.findUnique.mockResolvedValue(mockUser);

    await expect(
      service.register({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Duplicate',
        role: 'CLINICIAN' as any,
      }),
    ).rejects.toThrow(ConflictException);
  });
});
