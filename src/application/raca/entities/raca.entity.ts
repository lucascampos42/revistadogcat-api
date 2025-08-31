export class RacaEntity {
  racaId: string;
  nome: string;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<RacaEntity>) {
    Object.assign(this, data);
  }
}
