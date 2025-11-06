import { SexoCao, VideoOption, Raca, StatusCadastro } from '@prisma/client';
import { RacaEntity } from '../../raca/entities/raca.entity';

export class CadastroCaoEntity {
  cadastroId: string;
  userId: string;
  racaId: string;

  // Dados do cão
  nome: string;
  sexo: SexoCao;
  dataNascimento: Date;
  fotoPerfil: string;
  fotoLateral: string;
  peso?: string | null;
  altura?: string | null;

  // Pedigree
  temPedigree: boolean;
  registroPedigree?: string | null;
  pedigreeFrente?: string | null;
  pedigreeVerso?: string | null;

  // Microchip
  temMicrochip: boolean;
  numeroMicrochip?: string | null;

  // Informações adicionais
  titulos?: string | null;
  caracteristicas?: string | null;

  // Vídeo
  videoOption: VideoOption;
  videoUrl?: string | null;
  whatsappContato?: string | null;
  observacoes?: string | null;

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;

  // Campos de aprovação
  status: StatusCadastro;
  motivoRejeicao?: string | null;
  aprovadoPor?: string | null;
  aprovadoEm?: Date | null;

  // Campos de votação
  totalVotos: number;
  ativo: boolean;

  // Relação
  raca: RacaEntity;

  constructor(data: Partial<CadastroCaoEntity>) {
    Object.assign(this, data);
    if (data.raca) {
      this.raca = new RacaEntity(data.raca);
    }
  }

  // Método para verificar se tem pedigree
  hasPedigree(): boolean {
    return this.temPedigree;
  }

  // Método para verificar se tem microchip
  hasMicrochip(): boolean {
    return this.temMicrochip;
  }

  // Método para verificar se tem vídeo
  hasVideo(): boolean {
    return this.videoOption !== VideoOption.NONE;
  }

  // Método para obter idade do cão em anos
  getIdadeAnos(): number {
    const hoje = new Date();
    const nascimento = new Date(this.dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesAtual = hoje.getMonth();
    const mesNascimento = nascimento.getMonth();

    if (
      mesAtual < mesNascimento ||
      (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())
    ) {
      idade--;
    }

    return idade;
  }

  // Método para soft delete
  softDelete(): void {
    this.deletedAt = new Date();
  }

  // Método para verificar se foi deletado
  isDeleted(): boolean {
    return !!this.deletedAt;
  }

  // Método para verificar se está pendente
  isPendente(): boolean {
    return this.status === 'PENDENTE';
  }

  // Método para verificar se está aprovado
  isAprovado(): boolean {
    return this.status === 'APROVADO';
  }

  // Método para verificar se foi rejeitado
  isRejeitado(): boolean {
    return this.status === 'REJEITADO';
  }

  // Método para verificar se pode participar de votação
  podeParticiparVotacao(): boolean {
    return this.status === 'APROVADO' && this.ativo && !this.deletedAt;
  }
}
