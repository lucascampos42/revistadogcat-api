export class UserEntity {
  userId: string;
  name: string;
  avatarUrl?: string | null;

  constructor(data: Partial<UserEntity>) {
    Object.assign(this, data);
  }
}
