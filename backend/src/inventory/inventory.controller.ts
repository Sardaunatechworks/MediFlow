import {
  Controller,
  Post,
  Put,
  Get,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { ResponseHelper } from '../common/response.helper';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('pharmacies/:id/inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @Roles(UserRole.PHARMACY_ADMIN, UserRole.PHARMACY_STAFF)
  async addInventory(
    @Param('id') facilityId: string,
    @Body() dto: UpdateInventoryDto,
    @CurrentUser() user: any,
  ) {
    const inventory = await this.inventoryService.addInventory(facilityId, dto, user);
    return ResponseHelper.success('Inventory added successfully', inventory);
  }

  @Put(':medicineId')
  @Roles(UserRole.PHARMACY_ADMIN, UserRole.PHARMACY_STAFF)
  async updateInventory(
    @Param('id') facilityId: string,
    @Param('medicineId') medicineId: string,
    @Body() dto: UpdateInventoryDto,
    @CurrentUser() user: any,
  ) {
    const inventory = await this.inventoryService.updateInventory(
      facilityId,
      medicineId,
      dto,
      user,
    );
    return ResponseHelper.success('Inventory updated successfully', inventory);
  }

  @Get()
  async listInventory(@Param('id') facilityId: string) {
    const inventory = await this.inventoryService.listInventory(facilityId);
    return ResponseHelper.success('Inventory retrieved successfully', inventory);
  }
}
