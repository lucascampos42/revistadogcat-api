import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { UpdateUserDto } from '../auth/dto/update-auth.dto';
import { Roles } from '../../core/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RestoreUserDto } from './dto/restore-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UploadAvatarDto } from './dto/upload-avatar.dto';
import { multerConfig } from '../../core/config/multer.config';
import { AuthRequest } from '../auth/models/AuthRequest';
import { FullUserDto } from './dto/full-user.dto';

@ApiTags('Usuários')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register-third-party')
  @ApiOperation({ summary: 'Criar usuário para terceiro (simplificado)' })
  @ApiResponse({
    status: 201,
    description: 'Usuário terceiro criado com sucesso',
    schema: { example: { userId: 'cly123abcde' } },
  })
  @ApiResponse({
    status: 400,
    description: 'Email ou CPF já em uso ou dados inválidos',
  })
  @ApiBody({
    description: 'Dados básicos do usuário terceiro a ser criado.',
    schema: {
      type: 'object',
      properties: {
        nome: { type: 'string', example: 'Maria Santos' },
        email: { type: 'string', example: 'maria.santos@example.com' },
        cpf: { type: 'string', example: '987.654.321-00' },
        telefone: { type: 'string', example: '(11) 98888-7777' },
      },
      required: ['nome', 'email', 'cpf', 'telefone'],
    },
  })
  registerThirdParty(
    @Body()
    body: {
      nome: string;
      email: string;
      cpf: string;
      telefone: string;
    },
  ) {
    return this.userService.registerThirdParty(body);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Listar usuários com paginação e filtros' })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários retornada com sucesso',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Número da página (padrão: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Itens por página (padrão: 20)',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: Role,
    description: 'Filtrar por papel',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Buscar por nome, email ou username',
  })
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('role') role?: Role,
    @Query('search') search?: string,
  ) {
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    return this.userService.findAllPaged({
      page: pageNum,
      limit: limitNum,
      role,
      search,
    });
  }

  @Get('me')
  @ApiOperation({ summary: 'Obter perfil do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil completo do usuário', type: FullUserDto })
  getMyProfile(@Req() req: AuthRequest) {
    return this.userService.findMe(req.user);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Atualizar perfil do usuário autenticado' })
  updateMyProfile(
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: AuthRequest,
  ) {
    return this.userService.update(req.user.userId, updateUserDto, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  findOne(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.userService.findOneById(id, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar dados do usuário' })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: AuthRequest,
  ) {
    return this.userService.update(id, updateUserDto, req.user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Excluir usuário (soft delete)' })
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  @Patch(':id/role')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Atualizar role do usuário (apenas Admin)' })
  async updateUserRole(
    @Param('id') id: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ) {
    return this.userService.updateUserRole(id, updateUserRoleDto.role);
  }

  @Post(':id/restore')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Restaurar usuário excluído' })
  async restoreUser(@Param('id') id: string, @Body() _dto: RestoreUserDto) {
    return this.userService.restoreUser(id);
  }

  @Post('avatar-upload')
  @UseInterceptors(FileInterceptor('avatar', multerConfig))
  @ApiOperation({ summary: 'Upload de avatar do usuário' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadAvatarDto })
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthRequest,
  ) {
    if (!file) {
      throw new Error('Nenhum arquivo foi enviado');
    }
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    return this.userService.uploadAvatar(req.user.userId, avatarUrl);
  }
}
