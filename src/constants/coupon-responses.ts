export const COUPON_RESPONSES = {
    // Success
    SUCCESSFULLY_CREATED: 'Coupon book created successfully',
    SUCCESSFULLY_ASSIGNED: 'Coupon assigned successfully',
    SUCCESSFULLY_LOCKED: 'Coupon locked temporarily',
    SUCCESSFULLY_REDEEMED: 'Coupon redeemed successfully',
    SUCCESSFULLY_UNLOCKED: 'Coupon unlocked successfully',
    
    // State errors
    ALREADY_REDEEMED: 'This coupon has already been redeemed',
    ALREADY_ASSIGNED: 'This coupon is already assigned to another user',
    NOT_ASSIGNED_TO_USER: 'This coupon is not assigned to the user',
    COUPON_LOCKED: 'This coupon is temporarily locked',
    COUPON_EXPIRED: 'This coupon has expired',
    COUPON_NOT_FOUND: 'Coupon not found',
    
    // Limit errors
    MAX_COUPONS_REACHED: 'You have reached the maximum limit of coupons for this book',
    INSUFFICIENT_COUPONS: 'No coupons available in this book',
    NO_AVAILABLE_CODES: 'No codes available for assignment',
    
    // Business errors
    COUPON_BOOK_NOT_FOUND: 'Coupon book not found',
    COUPON_BOOK_INACTIVE: 'This coupon book is inactive',
    COUPON_BOOK_EXPIRED: 'This coupon book has expired',
    BUSINESS_NOT_AUTHORIZED: 'You are not authorized to access this coupon book',
    
    // Validation errors
    INVALID_COUPON_CODE: 'Invalid coupon code',
    INVALID_ASSIGNMENT: 'Invalid coupon assignment',
    INVALID_REDEMPTION: 'Invalid coupon redemption',
} as const;
