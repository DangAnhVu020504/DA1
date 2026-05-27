import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    if (createUserDto.role === UserRole.ADMIN) {
      const adminCount = await this.usersRepository.count({ where: { role: UserRole.ADMIN } });
      if (adminCount > 0) {
        throw new ForbiddenException('Admin account already exists.');
      }
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(createUserDto.password, salt);

    const user = this.usersRepository.create({
      ...createUserDto,
      passwordHash,
      isActive: true,
    });
    return this.usersRepository.save(user);
  }

  async createGoogleUser(profile: {
    email: string;
    fullName: string;
    avatar: string;
    provider: string;
    providerId: string;
  }): Promise<User> {
    const user = this.usersRepository.create({
      email: profile.email,
      fullName: profile.fullName,
      avatar: profile.avatar,
      provider: profile.provider,
      providerId: profile.providerId,
      role: UserRole.CUSTOMER,
      isActive: true,
    });
    return this.usersRepository.save(user);
  }

  findAll() {
    return this.usersRepository.find();
  }

  findOne(id: number) {
    return this.usersRepository.findOneBy({ id });
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.usersRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  remove(id: number) {
    return this.usersRepository.delete(id);
  }

  async updateAvatar(id: number, avatarUrl: string) {
    await this.usersRepository.update(id, { avatar: avatarUrl });
  }

  async updatePassword(id: number, newPasswordHash: string) {
    await this.usersRepository.update(id, { passwordHash: newPasswordHash });
  }
}
