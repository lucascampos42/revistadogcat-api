import { PartialType } from '@nestjs/swagger';
import { CreateCadastroCaoDto } from './create-cadastro-cao.dto';
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCadastroCaoDto extends PartialType(CreateCadastroCaoDto) {
  @ApiPropertyOptional({ description: 'URL da foto de perfil do cão' })
  @IsOptional()
  @IsString()
  fotoPerfil?: string;

  @ApiPropertyOptional({ description: 'URL da foto lateral do cão' })
  @IsOptional()
  @IsString()
  fotoLateral?: string;

  @ApiPropertyOptional({ description: 'URL do arquivo do pedigree (frente)' })
  @IsOptional()
  @IsString()
  pedigreeFrente?: string;

  @ApiPropertyOptional({ description: 'URL do arquivo do pedigree (verso)' })
  @IsOptional()
  @IsString()
  pedigreeVerso?: string;

  @ApiPropertyOptional({ description: 'URL do vídeo' })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional({ description: 'Status do cadastro' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Motivo da rejeição' })
  @IsOptional()
  @IsString()
  motivoRejeicao?: string;
}
