interface ComentarioAutor {
  userId: string;
  name: string;
  avatarUrl?: string | null;
}

export class ComentarioEntity {
  comentarioId: string;
  conteudo: string;
  createdAt: Date;
  updatedAt: Date;
  artigoId: string;
  autorId: string;
  autor: ComentarioAutor;

  constructor(data: Partial<ComentarioEntity>) {
    Object.assign(this, data);
  }
}
