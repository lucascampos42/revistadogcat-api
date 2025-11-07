import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RacaService } from './raca.service';
import { CreateRacaDto } from './dto/create-raca.dto';
import { UpdateRacaDto } from './dto/update-raca.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../core/decorators/roles.decorator';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { IsPublic } from '../../core/decorators/is-public.decorator';

@ApiTags('Raças')
@Controller('racas')
export class RacaController {
  constructor(private readonly racaService: RacaService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar uma nova raça' })
  @ApiResponse({ status: 201, description: 'A raça foi criada com sucesso.' })
  @ApiResponse({ status: 409, description: 'Raça com este nome já existe.' })
  create(@Body() createRacaDto: CreateRacaDto) {
    return this.racaService.create(createRacaDto);
  }

  @Get()
  @IsPublic()
  @ApiOperation({ summary: 'Listar todas as raças' })
  @ApiQuery({
    name: 'ativo',
    required: false,
    type: Boolean,
    description: 'Filtrar por raças ativas (true) ou inativas (false)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Buscar por nome da raça',
  })
  findAll(@Query('ativo') ativo?: string, @Query('search') search?: string) {
    const ativoBool = ativo === undefined ? undefined : ativo === 'true';
    return this.racaService.findAll(ativoBool, search);
  }

  @Get(':id')
  @IsPublic()
  @ApiOperation({ summary: 'Buscar uma raça por ID' })
  @ApiResponse({ status: 200, description: 'Raça encontrada.' })
  @ApiResponse({ status: 404, description: 'Raça não encontrada.' })
  findOne(@Param('id') id: string) {
    return this.racaService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar uma raça' })
  @ApiResponse({
    status: 200,
    description: 'A raça foi atualizada com sucesso.',
  })
  @ApiResponse({ status: 404, description: 'Raça não encontrada.' })
  update(@Param('id') id: string, @Body() updateRacaDto: UpdateRacaDto) {
    return this.racaService.update(id, updateRacaDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Inativar uma raça (soft delete)' })
  @ApiResponse({
    status: 200,
    description: 'A raça foi inativada com sucesso.',
  })
  @ApiResponse({ status: 404, description: 'Raça não encontrada.' })
  remove(@Param('id') id: string) {
    return this.racaService.remove(id);
  }
}
