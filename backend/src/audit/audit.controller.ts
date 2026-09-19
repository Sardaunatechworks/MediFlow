import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { ResponseHelper } from '../common/response.helper';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.HOSPITAL_ADMIN)
  async getAuditLogs(
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('facilityId') facilityId?: string,
    @Query('limit') limit?: string,
  ) {
    const logs = await this.auditService.findAll({
      action,
      entityType,
      facilityId,
      limit: limit ? parseInt(limit, 10) : 50,
    });
    return ResponseHelper.success('Audit logs retrieved successfully', logs);
  }
}
