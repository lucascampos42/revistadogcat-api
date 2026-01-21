import { Injectable } from '@nestjs/common';
import { ConfiguracaoRepository } from './repositories/configuracao.repository';
import { ConfiguracaoResponseDto } from './dto/configuracao-response.dto';
import { UpdateConfiguracaoDto } from './dto/update-configuracao.dto';
import { ConfiguracaoEntity } from './entities/configuracao.entity';

@Injectable()
export class ConfiguracaoService {
  constructor(
    private readonly configuracaoRepository: ConfiguracaoRepository,
  ) {}

  async buscarPorChave(chave: string): Promise<ConfiguracaoResponseDto | null> {
    const config = await this.configuracaoRepository.findByChave(chave);
    if (!config) {
      return null;
    }
    return this.mapToResponseDto(config);
  }

  async atualizarTaxaCadastro(valor: number): Promise<ConfiguracaoResponseDto> {
    const config = await this.configuracaoRepository.upsert(
      'TAXA_CADASTRO_CAO',
      valor.toString(),
      'Taxa de cadastro de cão em centavos',
    );
    return this.mapToResponseDto(config);
  }

  async buscarTaxaCadastro(): Promise<number> {
    const config =
      await this.configuracaoRepository.findByChave('TAXA_CADASTRO_CAO');
    if (!config) {
      return 5000;
    }
    return parseInt(config.valor, 10);
  }

  async listarTodas(): Promise<ConfiguracaoResponseDto[]> {
    const configs = await this.configuracaoRepository.findAll();
    return configs.map((c) => this.mapToResponseDto(c));
  }

  async atualizar(
    updateDto: UpdateConfiguracaoDto,
  ): Promise<ConfiguracaoResponseDto> {
    const config = await this.configuracaoRepository.upsert(
      updateDto.chave,
      updateDto.valor,
      updateDto.descricao,
    );
    return this.mapToResponseDto(config);
  }

  private mapToResponseDto(
    config: ConfiguracaoEntity,
  ): ConfiguracaoResponseDto {
    return {
      configuracaoId: config.configuracaoId,
      chave: config.chave,
      valor: config.valor,
      descricao: config.descricao ?? undefined,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }
}
