import { StatusArtigo } from '@prisma/client';

export class ArtigoEntity {
  artigoId: string;
  titulo: string;
  conteudo: any;
  resumo?: string | null;
  autor: string;
  categoria: string;
  status: StatusArtigo;
  dataPublicacao: Date;
  imagemCapa: string;
  visualizacoes: number;
  curtidas: number;
  comentarios: number;
  destaque: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;

  constructor(data: Partial<ArtigoEntity>) {
    Object.assign(this, data);
  }

  // Método para incrementar visualizações
  incrementarVisualizacoes(): void {
    this.visualizacoes += 1;
  }

  // Método para incrementar curtidas
  incrementarCurtidas(): void {
    this.curtidas += 1;
  }

  // Método para decrementar curtidas
  decrementarCurtidas(): void {
    if (this.curtidas > 0) {
      this.curtidas -= 1;
    }
  }

  // Método para verificar se está publicado
  isPublicado(): boolean {
    return this.status === StatusArtigo.PUBLICADO;
  }

  // Método para verificar se é destaque
  isDestaque(): boolean {
    return this.destaque;
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
}