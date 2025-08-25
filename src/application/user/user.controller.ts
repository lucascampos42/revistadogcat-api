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
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { UpdateUserDto } from '../auth/dto/update-auth.dto';
import { Roles } from '../../core/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { BlockUserDto } from './dto/block-user.dto';
import { RestoreUserDto } from './dto/restore-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UploadAvatarDto } from './dto/upload-avatar.dto';
import { multerConfig } from '../../core/config/multer.config';
import { AuthRequest } from '../auth/models/AuthRequest';

@ApiTags('Usuários')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Listar usuários com paginação e filtros' })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários retornada com sucesso',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - permissão insuficiente',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Número da página (padrão: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Itens por página (padrão: 20, máximo: 100)',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: Role,
    description: 'Filtrar por papel do usuário',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Buscar por nome, email ou username',
  })
  @ApiQuery({
    name: 'userName',
    required: false,
    description: 'Filtrar por username',
  })
  @ApiQuery({
    name: 'email',
    required: false,
    description: 'Filtrar por email',
  })
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('role') role?: Role,
    @Query('search') search?: string,
    @Query('userName') userName?: string,
    @Query('email') email?: string,
  ) {
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    return this.userService.findAllPaged({
      page: pageNum,
      limit: limitNum,
      role,
      search,
      userName,
      email,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  @ApiResponse({ status: 200, description: 'Usuário encontrado com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - usuário só pode ver seu próprio perfil (exceto ADMIN)',
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiParam({ name: 'id', description: 'ID único do usuário' })
  findOne(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.userService.findOneById(id, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar dados do usuário' })
  @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos fornecidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - usuário só pode editar seus próprios dados (exceto ADMIN)',
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiParam({ name: 'id', description: 'ID único do usuário' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Req() req: AuthRequest) {
    return this.userService.update(id, updateUserDto, req.user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Excluir usuário (soft delete)' })
  @ApiResponse({ status: 200, description: 'Usuário excluído com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - apenas administradores',
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiParam({ name: 'id', description: 'ID único do usuário' })
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  @Post(':id/block')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Bloquear usuário' })
  @ApiResponse({ status: 200, description: 'Usuário bloqueado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos fornecidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - permissão insuficiente',
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiParam({ name: 'id', description: 'ID único do usuário' })
  async blockUser(@Param('id') id: string, @Body() dto: BlockUserDto) {
    const blockedUntil = dto.blockedUntil
      ? new Date(dto.blockedUntil)
      : undefined;
    return this.userService.blockUser(id, blockedUntil);
  }

  @Post(':id/unblock')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Desbloquear usuário' })
  @ApiResponse({ status: 200, description: 'Usuário desbloqueado com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - permissão insuficiente',
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiParam({ name: 'id', description: 'ID único do usuário' })
  async unblockUser(@Param('id') id: string) {
    return this.userService.unblockUser(id);
  }

  @Patch(':id/role')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Atualizar role do usuário (apenas Admin)' })
  @ApiResponse({ status: 200, description: 'Role do usuário atualizado com sucesso' })
  @ApiResponse({ status: 400, description: 'Role inválido fornecido' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - apenas administradores',
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiParam({ name: 'id', description: 'ID único do usuário' })
  async updateUserRole(
    @Param('id') id: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ) {
    return this.userService.updateUserRole(id, updateUserRoleDto.role);
  }

  @Post(':id/restore')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Restaurar usuário excluído' })
  @ApiResponse({ status: 200, description: 'Usuário restaurado com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - apenas administradores',
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiParam({ name: 'id', description: 'ID único do usuário' })
  async restoreUser(@Param('id') id: string, @Body() _dto: RestoreUserDto) {
    return this.userService.restoreUser(id);
  }

  @Get('me')
  @ApiOperation({ summary: 'Obter perfil do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil do usuário retornado com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  getMyProfile(@Req() req: AuthRequest) {
    return this.userService.findOneById(req.user.userId, req.user);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Atualizar perfil do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil atualizado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos fornecidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - usuário não pode alterar seu próprio role',
  })
  updateMyProfile(@Body() updateUserDto: UpdateUserDto, @Req() req: AuthRequest) {
    return this.userService.update(req.user.userId, updateUserDto, req.user);
  }

  @Post('avatar-upload')
  @UseInterceptors(FileInterceptor('avatar', multerConfig))
  @ApiOperation({ summary: 'Upload de avatar do usuário' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload de arquivo de avatar',
    type: UploadAvatarDto,
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo de imagem do avatar (JPEG, PNG, WebP - máx. 5MB)',
        },
        description: {
          type: 'string',
          description: 'Descrição opcional para o upload',
          maxLength: 255,
        },
      },
      required: ['avatar'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Avatar atualizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        avatarUrl: { type: 'string' },
        user: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Arquivo inválido ou dados incorretos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 413, description: 'Arquivo muito grande (máx. 5MB)' })
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadAvatarDto: UploadAvatarDto,
    @Req() req: AuthRequest,
  ) {
    if (!file) {
      throw new Error('Nenhum arquivo foi enviado');
    }

    // Construir URL do avatar baseada no caminho do arquivo
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    
    // Atualizar o usuário com a nova URL do avatar
    const updatedUser = await this.userService.uploadAvatar(
      req.user.userId,
      avatarUrl,
    );

    return {
      message: 'Avatar atualizado com sucesso',
      avatarUrl,
      user: updatedUser,
    };
  }
}
