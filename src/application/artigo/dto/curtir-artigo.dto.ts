import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CurtirArtigoDto {
  @ApiProperty({
    description: 'Fingerprint único do dispositivo/navegador',
    example: 'abc123def456',
  })
  @IsString()
  fingerprint: string;

  @ApiProperty({
    description: 'ID do usuário (se logado)',
    required: false,
    example: 'clx1234567890',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({
    description: 'Endereço IP do usuário',
    required: false,
    example: '192.168.1.1',
  })
  @IsOptional()
  @IsString()
  ip?: string;

  @ApiProperty({
    description: 'User Agent do navegador',
    required: false,
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  })
  @IsOptional()
  @IsString()
  userAgent?: string;
}

export class ToggleCurtidaResponseDto {
  @ApiProperty({
    description: 'Se a curtida foi adicionada ou removida',
    example: true,
  })
  curtido: boolean;

  @ApiProperty({
    description: 'Total de curtidas no artigo',
    example: 42,
  })
  totalCurtidas: number;
}
