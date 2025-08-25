import { SexoCao, VideoOption } from '@prisma/client';

export class CadastroCaoEntity {
  cadastroId: string;
  userId: string;
  
  // Dados do proprietário
  proprietarioDiferente: boolean;
  nomeProprietario?: string | null;
  cpfProprietario?: string | null;
  emailProprietario?: string | null;
  telefoneProprietario?: string | null;
  enderecoProprietario?: string | null;
  cidade?: string | null;
  estado?: string | null;
  
  // Dados do cão
  nome: string;
  raca: string;
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

  constructor(data: Partial<CadastroCaoEntity>) {
    Object.assign(this, data);
  }

  // Método para verificar se tem proprietário diferente
  hasProprietarioDiferente(): boolean {
    return this.proprietarioDiferente;
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
    
    if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    
    return idade;
  }

  // Método para obter idade do cão em meses
  getIdadeMeses(): number {
    const hoje = new Date();
    const nascimento = new Date(this.dataNascimento);
    
    let anos = hoje.getFullYear() - nascimento.getFullYear();
    let meses = hoje.getMonth() - nascimento.getMonth();
    
    if (hoje.getDate() < nascimento.getDate()) {
      meses--;
    }
    
    if (meses < 0) {
      anos--;
      meses += 12;
    }
    
    return anos * 12 + meses;
  }

  // Método para verificar se é filhote (menos de 1 ano)
  isFilhote(): boolean {
    return this.getIdadeAnos() < 1;
  }

  // Método para verificar se é adulto (1-7 anos)
  isAdulto(): boolean {
    const idade = this.getIdadeAnos();
    return idade >= 1 && idade <= 7;
  }

  // Método para verificar se é idoso (mais de 7 anos)
  isIdoso(): boolean {
    return this.getIdadeAnos() > 7;
  }

  // Método para soft delete
  softDelete(): void {
    this.deletedAt = new Date();
  }

  // Método para restaurar
  restore(): void {
    this.deletedAt = null;
  }

  // Método para verificar se foi deletado
  isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  // Método para validar dados obrigatórios do proprietário
  validateProprietarioData(): boolean {
    if (!this.proprietarioDiferente) {
      return true;
    }
    
    return !!(this.nomeProprietario && 
             this.cpfProprietario && 
             this.emailProprietario && 
             this.telefoneProprietario && 
             this.enderecoProprietario && 
             this.cidade && 
             this.estado);
  }

  // Método para validar dados do pedigree
  validatePedigreeData(): boolean {
    if (!this.temPedigree) {
      return true;
    }
    
    return !!(this.registroPedigree && 
             this.pedigreeFrente && 
             this.pedigreeVerso);
  }

  // Método para validar dados do microchip
  validateMicrochipData(): boolean {
    if (!this.temMicrochip) {
      return true;
    }
    
    return !!this.numeroMicrochip;
  }

  // Método para validar dados do vídeo
  validateVideoData(): boolean {
    if (this.videoOption === VideoOption.NONE) {
      return true;
    }
    
    if (this.videoOption === VideoOption.WHATSAPP) {
      return !!this.whatsappContato;
    }
    
    if (this.videoOption === VideoOption.UPLOAD || this.videoOption === VideoOption.URL) {
      return !!this.videoUrl;
    }
    
    return true;
  }
}