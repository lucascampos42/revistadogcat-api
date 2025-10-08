import { PartialType } from '@nestjs/swagger';
import { CreateCadastroCaoDto } from './create-cadastro-cao.dto';

export class UpdateCadastroCaoDto extends PartialType(CreateCadastroCaoDto) {}
