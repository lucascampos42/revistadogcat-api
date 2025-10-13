import { StatusArtigo, CategoriaArtigo } from '@prisma/client';
import { ComentarioEntity } from './comentario.entity';
import { UserEntity } from './user.entity';

export class ArtigoEntity {
  artigoId: string;
  titulo: string;
  conteudo: any;
  resumo?: string | null;
  autorId: string;
  autor: UserEntity;
  categoria: CategoriaArtigo;
  status: StatusArtigo;
  dataPublicacao: Date;
  imagemCapa?: string | null;
  visualizacoes: number;
  curtidas: number;
  comentarios: ComentarioEntity[];
  destaque: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;

  constructor(data: Partial<ArtigoEntity>) {
    Object.assign(this, data);
    if (data.autor) {
      this.autor = new UserEntity(data.autor);
    }
    if (data.comentarios) {
      this.comentarios = data.comentarios.map((c) => new ComentarioEntity(c));
    }
  }

  incrementarVisualizacoes(): void {
    this.visualizacoes += 1;
  }

  incrementarCurtidas(): void {
    this.curtidas += 1;
  }

  decrementarCurtidas(): void {
    if (this.curtidas > 0) {
      this.curtidas -= 1;
    }
  }

  isPublicado(): boolean {
    return this.status === StatusArtigo.PUBLICADO;
  }

  isDeleted(): boolean {
    return this.deletedAt !== null;
  }
}
