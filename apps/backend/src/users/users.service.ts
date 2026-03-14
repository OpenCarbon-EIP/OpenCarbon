import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from '@dtos/user.dto';
import type { user } from 'src/generated/prisma/client';
import type { SafeUser } from 'src/types/user.types';
import { ConsultantService } from 'src/consultant/consultant.service';
import { CompanyService } from 'src/company/company.service';
import { hash } from 'bcrypt';

export const SAFE_USER_OMIT = {
  password: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly consultantService: ConsultantService,
    private readonly companyService: CompanyService,
  ) {}

  async getUserById(id: string): Promise<SafeUser | null> {
    if (!id) {
      throw new BadRequestException('User ID is required');
    }

    return await this.prisma.user.findUnique({
      where: { id },
      omit: SAFE_USER_OMIT,
      include: {
        consultant: true,
        company: true,
      },
    });
  }

  async getUserByEmail(email: string): Promise<user | null> {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  async createUser(createUserDto: CreateUserDto): Promise<SafeUser> {
    const { email, password, role } = createUserDto;

    if (!email || !password) {
      throw new BadRequestException('Email, name, and password are required');
    }

    return await this.prisma.user.create({
      data: {
        email,
        password,
        ...(role && { role }),
      },
    });
  }

  async updateUser(id: string, updateData: UpdateUserDto): Promise<SafeUser> {
    const {
      email,
      password,
      first_name,
      last_name,
      photo_url,
      description,
      company_name,
    } = updateData;

    const user = await this.getUserById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updateUserData: Partial<user> = {};

    if (email) {
      const existingUser = await this.getUserByEmail(email);

      if (existingUser && existingUser.id !== id) {
        throw new BadRequestException('Email already in use');
      }
      updateUserData.email = email;
    }

    if (password) {
      const saltRounds = 10;
      updateUserData.password = await hash(password, saltRounds);
    }

    if (user.role === 'CONSULTANT') {
      return await this.prisma.user.update({
        where: { id },
        data: {
          ...updateUserData,
          consultant: {
            update: {
              first_name,
              last_name,
              photo_url,
              description,
            },
          },
        },
        omit: SAFE_USER_OMIT,
        include: {
          consultant: true,
          company: true,
        },
      });
    } else {
      return await this.prisma.user.update({
        where: { id },
        data: {
          ...updateUserData,
          company: {
            update: {
              company_name,
              description,
            },
          },
        },
        omit: SAFE_USER_OMIT,
        include: {
          consultant: true,
          company: true,
        },
      });
    }
  }
}
