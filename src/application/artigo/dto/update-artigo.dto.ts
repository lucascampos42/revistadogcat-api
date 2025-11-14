import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateArtigoDto } from './create-artigo.dto';

// Removemos 'autorId' do DTO de atualização para evitar alteração de autor via update
export class UpdateArtigoDto extends PartialType(
  OmitType(CreateArtigoDto, ['autorId'] as const),
) {}
