import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum AcaoCadastro {
  APROVAR = 'APROVAR',
  REJEITAR = 'REJEITAR',
}

export class AprovarCadastroDto {
  @ApiProperty({
    description: 'Ação a ser realizada no cadastro',
    enum: AcaoCadastro,
    example: AcaoCadastro.APROVAR,
  })
  @IsEnum(AcaoCadastro, {
    message: 'Ação deve ser APROVAR ou REJEITAR',
  })
  acao: AcaoCadastro;

  @ApiProperty({
    description: 'Motivo da rejeição (obrigatório se ação for REJEITAR)',
    required: false,
    example: 'Documentação incompleta ou fotos não atendem aos requisitos',
  })
  @IsOptional()
  @IsString()
  motivoRejeicao?: string;
}

export class AprovarCadastroResponseDto {
  @ApiProperty({
    description: 'ID do cadastro',
    example: 'clx1234567890',
  })
  cadastroId: string;

  @ApiProperty({
    description: 'Status do cadastro após a ação',
    example: 'APROVADO',
  })
  status: string;

  @ApiProperty({
    description: 'Mensagem de confirmação',
    example: 'Cadastro aprovado com sucesso',
  })
  mensagem: string;

  @ApiProperty({
    description: 'Data da aprovação/rejeição',
    example: '2024-01-01T10:00:00.000Z',
  })
  dataAcao: Date;
}
