import { Controller, Get, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ContractDataDto } from './dto/contract-data.dto';

@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  /**
   * API: GET /contracts/generate-data/:appointmentId
   *
   * Lấy toàn bộ dữ liệu cần thiết để tạo hợp đồng BĐS.
   * Yêu cầu xác thực JWT.
   *
   * @param appointmentId - ID của cuộc hẹn (auto-parsed sang number bởi ParseIntPipe)
   * @returns ContractDataDto - payload chứa thông tin Bên A, Bên B, BĐS, ngày tháng
   */
  @Get('generate-data/:appointmentId')
  @UseGuards(JwtAuthGuard)
  async generateContractData(
    @Param('appointmentId', ParseIntPipe) appointmentId: number,
  ): Promise<ContractDataDto> {
    return this.contractsService.generateContractData(appointmentId);
  }
}
