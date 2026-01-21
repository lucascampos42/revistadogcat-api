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
  NotFoundException,
} from '@nestjs/common';
import { PagamentoService } from './pagamento.service';
import { PagamentoResponseDto } from './dto/pagamento-response.dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { IsPublic } from '../../core/decorators/is-public.decorator';

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

  @Get(':cadastroId')
  @UseGuards(JwtAuthGuard)
  async buscarPagamento(
    @Param('cadastroId') cadastroId: string,
    @Request() req,
  ): Promise<PagamentoResponseDto> {
    // PagamentoId agora é o CadastroId
    const result = await this.pagamentoService.buscarPorCadastro(cadastroId, req.user.userId);
    if (!result) {
        throw new NotFoundException('Pagamento não encontrado');
    }
    return result;
  }

  @Get('cadastro/:cadastroId')
  @UseGuards(JwtAuthGuard)
  async buscarPorCadastro(
    @Param('cadastroId') cadastroId: string,
    @Request() req,
  ): Promise<PagamentoResponseDto | null> {
    return this.pagamentoService.buscarPorCadastro(cadastroId, req.user.userId);
  }

  /*
  @Get('meus-pendentes')
  @UseGuards(JwtAuthGuard)
  async listarPendentes(@Request() req): Promise<PagamentoResponseDto[]> {
    // Implementação pendente: filtrar cadastros com statusPagamento = PENDENTE
    return [];
  }
  */

  @Get('verificar/:cadastroId')
  @UseGuards(JwtAuthGuard)
  async verificarPagamento(
    @Param('cadastroId') cadastroId: string,
    @Request() req,
  ): Promise<PagamentoResponseDto> {
    return this.pagamentoService.verificarPagamento(cadastroId, req.user.userId);
  }

  @Post('webhook')
  @IsPublic()
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
