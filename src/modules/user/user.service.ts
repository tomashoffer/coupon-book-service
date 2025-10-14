import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { FindOptionsWhere, Like, In } from "typeorm";
import { RoleType } from "../../constants/role-type";
import { UserNotFoundException } from "../../exceptions/user-not-found.exception";
import { OauthDto, UserRegisterDto } from "../auth/dto/UserRegister.dto";
import type { UserDto } from "./dto/user.dto";
import { UserEntity } from "./user.entity";
import { UserRepository } from "./user.repository";
import { v4 as uuidv4 } from "uuid";
import { generateHash } from '../../common/utils';
import { UpdateUserDto } from "./dto/update-user.dto";
import { AuthProviders } from "../../constants/auth.enums";

@Injectable()
export class UserService {
    constructor(
        public userRepository: UserRepository,
    ) {}

    // Métodos de cars eliminados - proyecto anterior

    async findOne(findData: FindOptionsWhere<UserEntity>): Promise<UserEntity | null> {
        const user = await this.userRepository.findOne({
            where: findData,
        });

        return user;
    }

    async findAll(): Promise<UserEntity[] | null> {
        const users = await this.userRepository.find({
            // relations eliminadas - proyecto anterior
        });

        return users;
    }

    async getById(id: string): Promise<UserEntity> {
        const user = await this.userRepository.findOne({
            where: { id },
        });

        if (!user) {
            throw new UserNotFoundException();
        }

        return user;
    }

    async createUser(
        userRegisterDto: UserRegisterDto | OauthDto
    ): Promise<UserEntity> {
        try {
            let userId = uuidv4();

            // Comentario eliminado - proyecto anterior
            if (userRegisterDto.id) {
                const existingUser = await this.userRepository.findOne({ where: { id: userRegisterDto.id } });
                if (existingUser) {
                    throw new HttpException('User already exists', HttpStatus.CONFLICT);
                }
                userId = userRegisterDto.id;
            }

            const userData = {
                ...userRegisterDto,
                id: userId,
                email: userRegisterDto.email.toLowerCase(),
                role: (userRegisterDto as any).role || RoleType.CUSTOMER,
                password: generateHash(userRegisterDto.password),
                authProvider: AuthProviders.LOCAL,
            };

            const user = this.userRepository.create(userData);
            await this.userRepository.save(user);

            return user;
        } catch (ex) {
            throw new HttpException(ex, HttpStatus.UNPROCESSABLE_ENTITY);
        }
    }

    async updateUser(userId: string, updateUserDto: UpdateUserDto) {
        try {
            const user = await this.userRepository.findOne({
                where: { id: userId },
            });

            if (user) {
                this.userRepository.merge(user, updateUserDto);
                const updatedUser = await this.userRepository.save(user);
                return updatedUser;
            }
        } catch (ex) {
            throw new HttpException(ex, HttpStatus.UNPROCESSABLE_ENTITY);
        }
    }

    async getUser(userId: string): Promise<UserDto> {
        const queryBuilder = this.userRepository.createQueryBuilder("user");

        queryBuilder.where("user.id = :userId", { userId });

        const userEntity = await queryBuilder.getOne();

        if (!userEntity) {
            throw new UserNotFoundException();
        }

        return userEntity.toDto();
    }

    async getUsersWithSorting(
        ascending: string,
        variable: string,
        rows: string
    ): Promise<UserEntity[]> {
        const sortOrder = ascending === "asc" ? "ASC" : "DESC";
        const takeNumer = Number(rows);
        return this.userRepository.find({
            order: { [variable]: sortOrder },
            take: takeNumer,
        });
    }

    async deleteUser(query: { [key: string]: any } = {}): Promise<any> {
        const user = await this.userRepository.findOneBy(query);

        if (user) {
            return this.userRepository.remove(user);
        } else {
            return this.userRepository.delete(query);
        }
    }

    async findByEmail(email: string): Promise<UserEntity | null> {
        return await this.userRepository.findOne({
            where: {
                email: email.toLowerCase(),
            },
        });
    }

    async findById(id: string): Promise<UserEntity | null> {
        return await this.userRepository.findOne({
            where: {
                id: id,
            },
        });
    }

    async update(userId: string, updateData: any): Promise<UserEntity> {
        const user = await this.getById(userId);
        Object.assign(user, updateData);
        return this.userRepository.save(user);
    }

    async sendVerificationEmail(email: string): Promise<void> {
        // Implementar envío de email de verificación
        console.log(`Sending verification email to: ${email}`);
    }

    async getEmailsByRegexp(searchQuery: string): Promise<string[]> {
        const users = await this.userRepository.find({
            where: { email: Like(`%${searchQuery}%`) },
        });
        return users.map((user) => user.email);
    }

    async filterUsersByDates(dateFrom?: string, dateTo?: string): Promise<UserEntity[]> {
        if (dateFrom && dateTo) {
            const fromDate = new Date(dateFrom);
            const toDate = new Date(dateTo);
            
            const filteredUsers = await this.userRepository
                .createQueryBuilder("user")
                .where("user.createdAt BETWEEN :fromDate AND :toDate", {
                    fromDate,
                    toDate,
                })
                .getMany();
            
            return filteredUsers;
        }
        return this.userRepository.find();
    }

    async filterUsers(searchTerm?: string): Promise<UserEntity[]> {
        try {
            const queryBuilder = this.userRepository.createQueryBuilder("users");

            if (searchTerm) {
                queryBuilder.andWhere("users.id::text LIKE :searchTerm", {
                    searchTerm: `%${searchTerm}%`,
                });
                queryBuilder.andWhere(
                    "users.first_name ILIKE :searchTerm OR users.last_name ILIKE :searchTerm OR users.email ILIKE :searchTerm",
                    { searchTerm: `%${searchTerm}%` }
                );
            }

            return await queryBuilder.getMany();
        } catch (ex) {
            throw new HttpException(ex, HttpStatus.UNPROCESSABLE_ENTITY);
        }
    }

    async findAllWithPagination(take: number, skip: number): Promise<UserEntity[]> {
        return this.userRepository.find({
            take,
            skip,
            order: { createdAt: 'DESC' },
        });
    }

    async getTotalUserCount(): Promise<number> {
        return this.userRepository.count();
    }
}