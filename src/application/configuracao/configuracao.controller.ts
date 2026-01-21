import { Controller, Get, Put, Body, UseGuards, Param } from '@nestjs/common';
import { ConfiguracaoService } from './configuracao.service';
import { ConfiguracaoResponseDto } from './dto/configuracao-response.dto';
import { UpdateConfiguracaoDto } from './dto/update-configuracao.dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('configuracao')
export class ConfiguracaoController {
  constructor(private readonly configuracaoService: ConfiguracaoService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  async listarTodas(): Promise<ConfiguracaoResponseDto[]> {
    return this.configuracaoService.listarTodas();
  }

  @Get('taxa-cadastro')
  async buscarTaxaCadastro(): Promise<{ valor: number }> {
    const valor = await this.configuracaoService.buscarTaxaCadastro();
    return { valor };
  }

  @Put('taxa-cadastro')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  async atualizarTaxaCadastro(
    @Body('valor') valor: number,
  ): Promise<ConfiguracaoResponseDto> {
    return this.configuracaoService.atualizarTaxaCadastro(valor);
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  async atualizar(
    @Body() updateDto: UpdateConfiguracaoDto,
  ): Promise<ConfiguracaoResponseDto> {
    return this.configuracaoService.atualizar(updateDto);
  }

  @Get(':chave')
  async buscarPorChave(
    @Param('chave') chave: string,
  ): Promise<ConfiguracaoResponseDto | null> {
    return this.configuracaoService.buscarPorChave(chave);
  }
}
