import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CouponBookEntity } from './entities/coupon-book.entity';
import { CouponCodeEntity } from './entities/coupon-code.entity';
import { CouponAssignmentEntity } from './entities/coupon-assignment.entity';
import { CouponRedemptionEntity } from './entities/coupon-redemption.entity';
import { UserEntity } from '../user/user.entity';
import { CouponStatus, CouponBookStatus } from '../../constants/coupon-status';
import { LOCK_CONFIG } from '../../constants/lock-config';
import { COUPON_RESPONSES } from '../../constants/coupon-responses';
import { GeneratorProvider } from '../../providers/generator.provider';
import { CreateCouponBookDto, UploadCodesDto, GenerateCodesDto, AssignCouponDto, UnlockCouponDto } from './dto';
import { CouponBookNotFoundException } from '../../exceptions/coupon-book-not-found.exception';
import { CouponNotFoundException } from '../../exceptions/coupon-not-found.exception';
import { CouponAlreadyRedeemedException } from '../../exceptions/coupon-already-redeemed.exception';
import { CouponNotAssignedToUserException } from '../../exceptions/coupon-not-assigned-to-user.exception';
import { CouponLockedException } from '../../exceptions/coupon-locked.exception';
import { InsufficientCouponsException } from '../../exceptions/insufficient-coupons.exception';

@Injectable()
export class CouponBooksService {
    constructor(
        @InjectRepository(CouponBookEntity)
        private readonly couponBookRepository: Repository<CouponBookEntity>,
        
        @InjectRepository(CouponCodeEntity)
        private readonly couponCodeRepository: Repository<CouponCodeEntity>,
        
        @InjectRepository(CouponAssignmentEntity)
        private readonly couponAssignmentRepository: Repository<CouponAssignmentEntity>,
        
        private readonly dataSource: DataSource,
    ) {}

    /**
     * Create a new coupon book
     * If autoGenerateCodes is provided, codes will be generated automatically
     */
    async createCouponBook(businessId: string, createDto: CreateCouponBookDto): Promise<CouponBookEntity> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Create the coupon book
            const couponBook = this.couponBookRepository.create({
                name: createDto.name,
                description: createDto.description,
                businessId,
                maxCodesPerUser: createDto.maxCodesPerUser,
                allowMultipleRedemptions: createDto.allowMultipleRedemptions,
                status: CouponBookStatus.DRAFT,
                expiresAt: createDto.expiresAt ? new Date(createDto.expiresAt) : undefined,
            });

            const savedCouponBook = await queryRunner.manager.save(couponBook);

            // Auto-generate codes if requested
            if (createDto.autoGenerateCodes) {
                const { pattern, count, length = 8 } = createDto.autoGenerateCodes;
   
                const generatedCodes = GeneratorProvider.generateMultipleCouponCodes(pattern, count, [], length);
                
                // Create coupon code entities
                const couponCodes = generatedCodes.map(code => 
                    this.couponCodeRepository.create({
                        code,
                        couponBookId: savedCouponBook.id,
                        status: CouponStatus.AVAILABLE,
                    })
                );

                // Save all codes
                await queryRunner.manager.save(couponCodes);

                // Update total codes
                savedCouponBook.totalCodes = count;
                savedCouponBook.status = CouponBookStatus.ACTIVE;
                await queryRunner.manager.save(savedCouponBook);
            }

            await queryRunner.commitTransaction();
            
            return savedCouponBook;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Upload coupon codes to an existing book
     */
    async uploadCodes(couponBookId: string, uploadDto: UploadCodesDto): Promise<CouponCodeEntity[]> {
        const couponBook = await this.couponBookRepository.findOne({
            where: { id: couponBookId }
        });

        if (!couponBook) {
            throw new CouponBookNotFoundException(couponBookId);
        }

        // Check that codes don't already exist
        const existingCodes = await this.couponCodeRepository.find({
            where: { code: uploadDto.codes as any }
        });

        if (existingCodes.length > 0) {
            throw new ConflictException(`The following codes already exist: ${existingCodes.map(c => c.code).join(', ')}`);
        }

        // Create coupon codes
        const couponCodes = uploadDto.codes.map(code => 
            this.couponCodeRepository.create({
                code,
                couponBookId,
                status: CouponStatus.AVAILABLE,
            })
        );

        const savedCodes = await this.couponCodeRepository.save(couponCodes);

        // Update total codes in the book
        await this.couponBookRepository.update(couponBookId, {
            totalCodes: couponBook.totalCodes + savedCodes.length
        });

        return savedCodes;
    }

    /**
     * Generate coupon codes automatically
     */
    async generateCodes(couponBookId: string, generateDto: GenerateCodesDto): Promise<CouponCodeEntity[]> {
        const couponBook = await this.couponBookRepository.findOne({
            where: { id: couponBookId }
        });

        if (!couponBook) {
            throw new CouponBookNotFoundException(couponBookId);
        }

        // Get existing codes to avoid duplicates
        const existingCodes = await this.couponCodeRepository.find({
            where: { couponBookId }
        });

        const existingCodeStrings = existingCodes.map(c => c.code);

        // Generate unique codes
        const newCodes = GeneratorProvider.generateMultipleCouponCodes(
            generateDto.pattern,
            generateDto.totalCodes,
            existingCodeStrings
        );

        // Create code entities with conflict handling
        const savedCodes = [];
        for (const code of newCodes) {
            try {
                const couponCode = this.couponCodeRepository.create({
                    code,
                    couponBookId,
                    status: CouponStatus.AVAILABLE,
                });
                
                const savedCode = await this.couponCodeRepository.save(couponCode);
                savedCodes.push(savedCode);
            } catch (error) {
                // Ignore duplicate codes
                if (error.code === '23505') { // PostgreSQL unique violation
                    console.log(`Skipping duplicate code: ${code}`);
                    continue;
                }
                throw error;
            }
        }

        // Update total codes in the book
        await this.couponBookRepository.update(couponBookId, {
            totalCodes: couponBook.totalCodes + savedCodes.length
        });

        return savedCodes;
    }

    /**
     * Assign a random coupon to a user
     */
    async assignRandomCoupon(couponBookId: string, userId: string): Promise<any> {
        return await this.dataSource.transaction(async manager => {
            // Check that the user exists
            const user = await manager.findOne(UserEntity, {
                where: { id: userId }
            });

            if (!user) {
                throw new NotFoundException('User not found');
            }

            // Check that the coupon book exists and is active
            const couponBook = await manager.findOne(CouponBookEntity, {
                where: { id: couponBookId }
            });

            if (!couponBook) {
                throw new CouponBookNotFoundException(couponBookId);
            }

            if (couponBook.status !== CouponBookStatus.ACTIVE) {
                throw new BadRequestException('The coupon book is not active');
            }

            // Check coupon limit per user
            if (couponBook.maxCodesPerUser) {
                const userAssignments = await manager.count(CouponAssignmentEntity, {
                    where: { 
                        userId: userId,
                        couponCode: { couponBookId }
                    }
                });

                if (userAssignments >= couponBook.maxCodesPerUser) {
                    throw new BadRequestException(COUPON_RESPONSES.MAX_COUPONS_REACHED);
                }
            }

            // Find an available coupon
            const availableCoupon = await manager.findOne(CouponCodeEntity, {
                where: {
                    couponBookId,
                    status: CouponStatus.AVAILABLE
                },
                lock: { mode: 'pessimistic_write' }
            });

            if (!availableCoupon) {
                throw new InsufficientCouponsException(0, 1);
            }

            // Update coupon status
            await manager.update(CouponCodeEntity, availableCoupon.id, {
                status: CouponStatus.ASSIGNED,
                assignedToUserId: userId,
                assignedAt: new Date()
            });

            // Create assignment
            const assignment = manager.create(CouponAssignmentEntity, {
                couponCodeId: availableCoupon.id,
                userId: userId,
                assignedAt: new Date()
            });

            const savedAssignment = await manager.save(assignment);
            
            // Return assignment with coupon code
            return {
                ...savedAssignment,
                couponCode: availableCoupon.code
            };
        });
    }

    /**
     * Assign a specific coupon to a user
     */
    async assignSpecificCoupon(couponCode: string, assignDto: AssignCouponDto): Promise<any> {
        return await this.dataSource.transaction(async manager => {
            // Verificar que el usuario existe
            const user = await manager.findOne(UserEntity, {
                where: { id: assignDto.userId }
            });

            if (!user) {
                throw new NotFoundException('User not found');
            }

            // Find the coupon WITH LOCK (without relations)
            const coupon = await manager.findOne(CouponCodeEntity, {
                where: { code: couponCode },
                lock: { mode: 'pessimistic_write' }
            });

            if (!coupon) {
                throw new CouponNotFoundException(couponCode);
            }

            // Buscar el coupon book por separado (sin lock)
            const couponBook = await manager.findOne(CouponBookEntity, {
                where: { id: coupon.couponBookId }
            });

            if (!couponBook) {
                throw new CouponBookNotFoundException(coupon.couponBookId);
            }

            // Verify that the coupon is available
            if (coupon.status !== CouponStatus.AVAILABLE) {
                throw new ConflictException('This coupon is not available for assignment');
            }

            // Verify coupon limit per user
            if (couponBook.maxCodesPerUser) {
                const userAssignments = await manager.count(CouponAssignmentEntity, {
                    where: { 
                        userId: assignDto.userId,
                        couponCode: { couponBookId: coupon.couponBookId }
                    }
                });

                if (userAssignments >= couponBook.maxCodesPerUser) {
                    throw new BadRequestException(COUPON_RESPONSES.MAX_COUPONS_REACHED);
                }
            }

            // Update coupon status
            await manager.update(CouponCodeEntity, coupon.id, {
                status: CouponStatus.ASSIGNED,
                assignedToUserId: assignDto.userId,
                assignedAt: new Date()
            });

            // Create assignment
            const assignment = manager.create(CouponAssignmentEntity, {
                couponCodeId: coupon.id,
                userId: assignDto.userId,
                assignedAt: new Date()
            });

            const savedAssignment = await manager.save(assignment);
            
            // Return assignment with coupon code
            return {
                ...savedAssignment,
                couponCode: coupon.code
            };
        });
    }

    /**
     * Lock a coupon temporarily
     */
    async lockCoupon(couponCode: string, userId: string): Promise<any> {
        return await this.dataSource.transaction(async manager => {
            const coupon = await manager.findOne(CouponCodeEntity, {
                where: { code: couponCode },
                lock: { mode: 'pessimistic_write' }
            });

            if (!coupon) {
                throw new CouponNotFoundException(couponCode);
            }

            if (coupon.assignedToUserId !== userId) {
                throw new CouponNotAssignedToUserException(couponCode, userId);
            }

            if (coupon.status === CouponStatus.REDEEMED) {
                throw new CouponAlreadyRedeemedException(couponCode);
            }

            if (coupon.status === CouponStatus.LOCKED) {
                // Check if the lock is still valid and belongs to the user
                if (coupon.lockedByUserId === userId && coupon.lockExpiresAt && coupon.lockExpiresAt > new Date()) {
                    // User already has a valid lock, return the coupon
                    return await manager.findOne(CouponCodeEntity, { where: { id: coupon.id } });
                } else if (coupon.lockExpiresAt && coupon.lockExpiresAt <= new Date()) {
                    // Lock expired, we can proceed to lock it again
                } else {
                    // Lock is valid and belongs to someone else
                    throw new CouponLockedException(couponCode);
                }
            }

            // Lock temporarily with ownership and expiration (24 hours)
            const lockExpiresAt = new Date(Date.now() + LOCK_CONFIG.DEFAULT_TTL_MS);
            
            await manager.update(CouponCodeEntity, coupon.id, {
                status: CouponStatus.LOCKED,
                lockedAt: new Date(),
                lockedByUserId: userId,
                lockExpiresAt: lockExpiresAt
            });

            return await manager.findOne(CouponCodeEntity, { where: { id: coupon.id } });
        });
    }

    /**
     * Unlock a coupon (remove lock)
     */
    async unlockCoupon(couponCode: string, userId: string): Promise<any> {
        return await this.dataSource.transaction(async manager => {
            const coupon = await manager.findOne(CouponCodeEntity, {
                where: { code: couponCode },
                lock: { mode: 'pessimistic_write' }
            });

            if (!coupon) {
                throw new CouponNotFoundException(couponCode);
            }

            if (coupon.status !== CouponStatus.LOCKED) {
                throw new BadRequestException('This coupon is not locked');
            }

            // Check if the user owns the lock or is admin/business
            if (coupon.lockedByUserId !== userId) {
                throw new BadRequestException('You can only unlock coupons that you locked');
            }

            // Unlock the coupon
            await manager.update(CouponCodeEntity, coupon.id, {
                status: CouponStatus.ASSIGNED, // Return to assigned status
                lockedAt: null,
                lockedByUserId: null,
                lockExpiresAt: null
            });

            return await manager.findOne(CouponCodeEntity, { where: { id: coupon.id } });
        });
    }

    /**
     * Clean up expired locks
     */
    async cleanupExpiredLocks(): Promise<number> {
        const result = await this.couponCodeRepository
            .createQueryBuilder()
            .update(CouponCodeEntity)
            .set({
                status: CouponStatus.ASSIGNED,
                lockedAt: null,
                lockedByUserId: null,
                lockExpiresAt: null
            })
            .where('status = :status', { status: CouponStatus.LOCKED })
            .andWhere('lock_expires_at < :now', { now: new Date() })
            .execute();

        return result.affected || 0;
    }

    /**
     * Redeem a coupon
     */
    async redeemCoupon(couponCode: string, userId: string, metadata?: Record<string, any>): Promise<any> {
        return await this.dataSource.transaction(async manager => {
            // First, get the coupon with lock (without relations)
            const coupon = await manager.findOne(CouponCodeEntity, {
                where: { code: couponCode },
                lock: { mode: 'pessimistic_write' }
            });

            if (!coupon) {
                throw new CouponNotFoundException(couponCode);
            }

            if (coupon.assignedToUserId !== userId) {
                throw new CouponNotAssignedToUserException(couponCode, userId);
            }

            if (coupon.status === CouponStatus.REDEEMED) {
                throw new CouponAlreadyRedeemedException(couponCode);
            }

            if (coupon.status === CouponStatus.AVAILABLE) {
                throw new BadRequestException('The coupon must be assigned before being redeemed.');
            }

            if (coupon.status === CouponStatus.LOCKED) {
                // Check if the lock belongs to the user and is still valid
                if (coupon.lockedByUserId !== userId) {
                    throw new BadRequestException('This coupon is locked by another user');
                }
                
                if (!coupon.lockExpiresAt || coupon.lockExpiresAt <= new Date()) {
                    throw new BadRequestException('This coupon lock has expired');
                }
                
                // User owns the lock and it's valid, allow redemption
            }

            // Now get the coupon book data separately
            const couponBook = await manager.findOne(CouponBookEntity, {
                where: { id: coupon.couponBookId }
            });

            // Create redemption record
            const redemption = manager.create(CouponRedemptionEntity, {
                couponCodeId: coupon.id,
                userId,
                redeemedAt: new Date(),
                metadata
            });

            const savedRedemption = await manager.save(redemption);

            // Update coupon status
            const newStatus = couponBook.allowMultipleRedemptions 
                ? CouponStatus.ASSIGNED 
                : CouponStatus.REDEEMED;

            await manager.update(CouponCodeEntity, coupon.id, {
                status: newStatus,
                redeemedAt: new Date(),
                lockedAt: null, // Unlock if it was locked
                lockedByUserId: null, // Clear lock owner
                lockExpiresAt: null // Clear lock expiration
            });

            // Return redemption with coupon code
            return {
                ...savedRedemption,
                couponCode: coupon.code
            };
        });
    }

    /**
     * Obtener cupones asignados a un usuario
     */
    async getUserCoupons(userId: string): Promise<CouponAssignmentEntity[]> {
        return await this.couponAssignmentRepository.find({
            where: { userId },
            relations: ['couponCode', 'couponCode.couponBook'],
            order: { assignedAt: 'DESC' }
        });
    }

    /**
     * Obtener libro de cupones por ID
     */
    async getCouponBookById(id: string): Promise<CouponBookEntity> {
        const couponBook = await this.couponBookRepository.findOne({
            where: { id },
            relations: ['business', 'couponCodes']
        });

        if (!couponBook) {
            throw new CouponBookNotFoundException(id);
        }

        return couponBook;
    }
}
