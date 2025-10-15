export enum CouponStatus {
    AVAILABLE = 'AVAILABLE',    // Code available for assignment
    ASSIGNED = 'ASSIGNED',      // Code assigned to a user
    LOCKED = 'LOCKED',          // Code temporarily locked (redemption attempt)
    REDEEMED = 'REDEEMED',      // Code permanently redeemed
    EXPIRED = 'EXPIRED',        // Code expired
}

export enum CouponBookStatus {
    ACTIVE = 'ACTIVE',          // Book active and available
    INACTIVE = 'INACTIVE',      // Book deactivated
    EXPIRED = 'EXPIRED',        // Book expired
    DRAFT = 'DRAFT',            // Book in draft
}
