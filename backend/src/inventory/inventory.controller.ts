import { Controller, Post, Put, Get, Param, Body } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { ResponseHelper } from '../common/response.helper';

@Controller('pharmacies/:id/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // TODO: Auth guard — requires PHARMACY_ADMIN or PHARMACY_STAFF role
  @Post()
  async addInventory(
    @Param('id') facilityId: string,
    @Body() dto: UpdateInventoryDto,
  ) {
    const inventory = await this.inventoryService.addInventory(facilityId, dto);
    return ResponseHelper.success('Inventory added successfully', inventory);
  }

  // TODO: Auth guard — requires PHARMACY_ADMIN or PHARMACY_STAFF role
  @Put(':medicineId')
  async updateInventory(
    @Param('id') facilityId: string,
    @Param('medicineId') medicineId: string,
    @Body() dto: UpdateInventoryDto,
  ) {
    const inventory = await this.inventoryService.updateInventory(
      facilityId,
      medicineId,
      dto,
    );
    return ResponseHelper.success('Inventory updated successfully', inventory);
  }

  // TODO: Auth guard — requires PHARMACY_ADMIN, PHARMACY_STAFF or authenticated role
  @Get()
  async listInventory(@Param('id') facilityId: string) {
    const inventory = await this.inventoryService.listInventory(facilityId);
    return ResponseHelper.success('Inventory retrieved successfully', inventory);
  }
}
