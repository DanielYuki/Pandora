import { IUserService } from '@/core/interfaces/user.interface';
import { UserCacheService } from '@/services/user-cache.service';
import { User } from '@/core/entities';

export class UserCacheAdapter implements IUserService {
  private service: UserCacheService;

  constructor() {
    this.service = new UserCacheService();
  }

  async getUserByPhone(phone: string): Promise<User | null> {
    return this.service.getUserByPhone(phone);
  }
}
