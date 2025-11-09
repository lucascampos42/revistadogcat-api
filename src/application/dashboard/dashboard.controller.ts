import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '@nestjs/passport';
import { ResponseHelper } from '../../core/utils/response-helper';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getDashboardData() {
    const cards = await this.dashboardService.getDashboardCards();
    const monthlyGrowth = await this.dashboardService.getMonthlyGrowth();
    const userDistribution = await this.dashboardService.getUserDistribution();

    // Padroniza a resposta com o wrapper utilizado pelo frontend
    return ResponseHelper.success({
      cards,
      monthlyGrowth,
      userDistribution,
    });
  }
}
