import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ description: 'O Refresh Token para obter um novo Access Token' })
  refresh_token: string;
}
