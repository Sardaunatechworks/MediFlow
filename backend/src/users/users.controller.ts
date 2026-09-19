import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ResponseHelper } from '../common/response.helper';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.PHARMACY_ADMIN)
  async getUsers(
    @CurrentUser() user: any,
    @Query('facilityId') facilityId?: string,
    @Query('role') role?: UserRole,
  ) {
    // Hospital and Pharmacy admins can only view their own facility staff
    let effectiveFacilityId = facilityId;
    if (user.role === UserRole.HOSPITAL_ADMIN || user.role === UserRole.PHARMACY_ADMIN) {
      effectiveFacilityId = user.facilityId;
    }

    const users = await this.usersService.findAll({
      facilityId: effectiveFacilityId,
      role,
    });
    return ResponseHelper.success('Users retrieved successfully', users);
  }

  @Get(':id')
  async getUserById(@Param('id') id: string, @CurrentUser() user: any) {
    // Users can see their own profile or admins can view any profile
    if (
      user.id !== id &&
      user.role !== UserRole.PLATFORM_ADMIN &&
      user.role !== UserRole.HOSPITAL_ADMIN
    ) {
      throw new ForbiddenException('You can only view your own user profile');
    }

    const targetUser = await this.usersService.findById(id);
    return ResponseHelper.success('User retrieved successfully', targetUser);
  }

  @Patch(':id/role')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.HOSPITAL_ADMIN)
  async updateRole(
    @Param('id') id: string,
    @Body('role') newRole: UserRole,
    @CurrentUser() adminUser: any,
  ) {
    const updated = await this.usersService.updateRole(id, newRole, adminUser);
    return ResponseHelper.success('User role updated successfully', updated);
  }
}
