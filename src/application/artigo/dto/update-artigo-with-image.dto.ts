import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateArtigoWithImageDto } from './create-artigo-with-image.dto';

// Removemos 'autorId' do DTO de atualização com imagem
export class UpdateArtigoWithImageDto extends PartialType(
  OmitType(CreateArtigoWithImageDto, ['autorId'] as const),
) {}
