import { PartialType } from '@nestjs/swagger';
import { CreateArtigoWithImageDto } from './create-artigo-with-image.dto';

export class UpdateArtigoWithImageDto extends PartialType(
  CreateArtigoWithImageDto,
) {}
