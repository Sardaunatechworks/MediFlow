import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private auditService: AuditService,
  ) {}

  async validateUser(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        facility: {
          select: {
            id: true,
            name: true,
            type: true,
            verificationStatus: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      return null;
    }

    const { password, ...safeUser } = user;
    return safeUser;
  }

  async login(loginDto: LoginDto, ipAddress?: string) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      await this.auditService.log({
        userEmail: loginDto.email.toLowerCase(),
        action: 'LOGIN_FAILED',
        entityType: 'User',
        details: { reason: 'Invalid email or password' },
        ipAddress,
      });

      throw new UnauthorizedException({
        success: false,
        message: 'Invalid email or password',
        error: { code: 'INVALID_CREDENTIALS', details: [] },
      });
    }

    if (!user.isActive) {
      await this.auditService.log({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: 'LOGIN_BLOCKED',
        entityType: 'User',
        details: { reason: 'Account deactivated' },
        ipAddress,
      });

      throw new UnauthorizedException({
        success: false,
        message: 'Account has been deactivated',
        error: { code: 'ACCOUNT_DEACTIVATED', details: [] },
      });
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      facilityId: user.facilityId,
    };

    const accessToken = this.jwtService.sign(payload);

    await this.auditService.log({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'LOGIN_SUCCESS',
      entityType: 'User',
      entityId: user.id,
      facilityId: user.facilityId ?? undefined,
      details: { role: user.role, facility: user.facility?.name },
      ipAddress,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        title: user.title,
        facilityId: user.facilityId,
        facility: user.facility,
      },
    };
  }

  async register(registerDto: RegisterDto, ipAddress?: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: registerDto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException({
        success: false,
        message: 'A user with this email address already exists',
        error: { code: 'EMAIL_ALREADY_EXISTS', details: [] },
      });
    }

    if (registerDto.facilityId) {
      const facility = await this.prisma.facility.findUnique({
        where: { id: registerDto.facilityId },
      });
      if (!facility) {
        throw new NotFoundException({
          success: false,
          message: 'Specified facility was not found',
          error: { code: 'FACILITY_NOT_FOUND', details: [] },
        });
      }
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const newUser = await this.prisma.user.create({
      data: {
        email: registerDto.email.toLowerCase(),
        password: hashedPassword,
        name: registerDto.name,
        role: registerDto.role,
        title: registerDto.title,
        facilityId: registerDto.facilityId,
        phone: registerDto.phone,
      },
      include: {
        facility: {
          select: {
            id: true,
            name: true,
            type: true,
            verificationStatus: true,
            status: true,
          },
        },
      },
    });

    await this.auditService.log({
      userId: newUser.id,
      userEmail: newUser.email,
      userRole: newUser.role,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: newUser.id,
      facilityId: newUser.facilityId ?? undefined,
      details: { role: newUser.role },
      ipAddress,
    });

    const payload = {
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
      facilityId: newUser.facilityId,
    };

    const accessToken = this.jwtService.sign(payload);

    const { password, ...safeUser } = newUser;
    return {
      accessToken,
      user: safeUser,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        facility: {
          include: {
            pharmacyProfile: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException({
        success: false,
        message: 'User not found',
        error: { code: 'USER_NOT_FOUND', details: [] },
      });
    }

    const { password, ...safeUser } = user;
    return safeUser;
  }
}
