import {
  Controller,
  Get,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { RestrictedGuard } from '../../../auth/restricted.guard';
import { DashboardService } from './dashboard.service';
import { handleRequest } from '../../../global/handleRequest';
import { ResponseDataOutput, ResponseDataWhenError } from '../../../global/GlobalResponseData';
import { JwtUserPayload } from '../../user/user.interface';

@Controller('api/v1/finance/dashboard')
@UseGuards(JwtAuthGuard, RestrictedGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Get dashboard data
   * GET /api/v1/finance/dashboard?startDate=2024-01-01&endDate=2024-12-31
   */
  @Get()
  async getDashboard(
    @Request() req: { user: JwtUserPayload },
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<ResponseDataOutput<any | ResponseDataWhenError>> {
    if (!req.user || !req.user.user_id) {
      throw new Error('User not authenticated');
    }

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return handleRequest<any>({
      execute: () => this.dashboardService.getDashboardData(req.user.user_id, start, end),
      actionName: 'getDashboard',
    });
  }
}
