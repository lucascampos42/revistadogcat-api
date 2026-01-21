import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PagamentoService } from './pagamento.service';
import { PagamentoResponseDto } from './dto/pagamento-response.dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';

@Controller('pagamento')
export class PagamentoController {
  constructor(private readonly pagamentoService: PagamentoService) {}

  @Post('criar-link/:cadastroId')
  @UseGuards(JwtAuthGuard)
  async criarLinkPagamento(
    @Param('cadastroId') cadastroId: string,
    @Request() req,
  ): Promise<PagamentoResponseDto> {
    return this.pagamentoService.criarLinkPagamento(cadastroId, req.user.userId);
  }

  @Get(':pagamentoId')
  @UseGuards(JwtAuthGuard)
  async buscarPagamento(
    @Param('pagamentoId') pagamentoId: string,
    @Request() req,
  ): Promise<PagamentoResponseDto> {
    return this.pagamentoService.buscarPorId(pagamentoId, req.user.userId);
  }

  @Get('cadastro/:cadastroId')
  @UseGuards(JwtAuthGuard)
  async buscarPorCadastro(
    @Param('cadastroId') cadastroId: string,
    @Request() req,
  ): Promise<PagamentoResponseDto | null> {
    return this.pagamentoService.buscarPorCadastro(cadastroId, req.user.userId);
  }

  @Get('meus-pendentes')
  @UseGuards(JwtAuthGuard)
  async listarPendentes(@Request() req): Promise<PagamentoResponseDto[]> {
    return this.pagamentoService.listarPendentesPorUsuario(req.user.userId);
  }

  @Get('verificar/:pagamentoId')
  @UseGuards(JwtAuthGuard)
  async verificarPagamento(
    @Param('pagamentoId') pagamentoId: string,
    @Request() req,
  ): Promise<PagamentoResponseDto> {
    return this.pagamentoService.verificarPagamento(pagamentoId, req.user.userId);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async processarWebhook(@Body() data: any): Promise<{ success: boolean }> {
    await this.pagamentoService.processarWebhook(data);
    return { success: true };
  }

  @Get('order/:orderNsu')
  async buscarPorOrderNsu(
    @Param('orderNsu') orderNsu: string,
  ): Promise<PagamentoResponseDto | null> {
    return this.pagamentoService.buscarPorOrderNsu(orderNsu);
  }
}
