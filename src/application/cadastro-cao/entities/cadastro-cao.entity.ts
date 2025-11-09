import { SexoCao, VideoOption, StatusCadastro } from '@prisma/client';
import { RacaEntity } from '../../raca/entities/raca.entity';

interface UserInCaoEntity {
  userId: string;
  name: string;
  email: string;
  telefone?: string | null;
}

export class CadastroCaoEntity {
  cadastroId: string;
  userId: string;
  racaId?: string | null;
  racaSugerida?: string | null;
  nome: string;
  sexo: SexoCao;
  dataNascimento: Date;
  fotoPerfil: string;
  fotoLateral: string;
  peso?: string | null;
  altura?: string | null;
  temPedigree: boolean;
  registroPedigree?: string | null;
  pedigreeFrente?: string | null;
  pedigreeVerso?: string | null;
  temMicrochip: boolean;
  numeroMicrochip?: string | null;
  titulos?: string | null;
  caracteristicas?: string | null;
  videoOption: VideoOption;
  videoUrl?: string | null;
  whatsappContato?: string | null;
  observacoes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  status: StatusCadastro;
  motivoRejeicao?: string | null;
  aprovadoPor?: string | null;
  aprovadoEm?: Date | null;
  totalVotos: number;
  ativo: boolean;
  raca?: RacaEntity | null;
  user?: UserInCaoEntity | null;

  constructor(data: Partial<CadastroCaoEntity>) {
    Object.assign(this, data);
    if (data.raca) {
      this.raca = new RacaEntity(data.raca as any);
    }
    if (data.user) {
      this.user = data.user;
    }
  }

  hasPedigree(): boolean {
    return this.temPedigree;
  }

  hasMicrochip(): boolean {
    return this.temMicrochip;
  }

  hasVideo(): boolean {
    return this.videoOption !== VideoOption.NONE;
  }

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

  softDelete(): void {
    this.deletedAt = new Date();
  }

  isDeleted(): boolean {
    return !!this.deletedAt;
  }

  isPendente(): boolean {
    // Mantemos o nome do método por compatibilidade, mas agora
    // "pendente" significa "cadastro incompleto" segundo a nova regra.
    return this.status === 'CADASTRO_INCOMPLETO';
  }

  isAprovado(): boolean {
    return this.status === 'APROVADO';
  }

  isRejeitado(): boolean {
    return this.status === 'REJEITADO';
  }

  podeParticiparVotacao(): boolean {
    return this.status === 'APROVADO' && this.ativo && !this.deletedAt;
  }
}
