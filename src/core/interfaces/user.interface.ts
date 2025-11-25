import { User } from '@/core/entities';

export interface IUserService {
  getUserByPhone(phone: string): Promise<User | null>;
}
