export enum CouponStatus {
    AVAILABLE = 'AVAILABLE',    // Código disponible para asignar
    ASSIGNED = 'ASSIGNED',      // Código asignado a un usuario
    LOCKED = 'LOCKED',          // Código bloqueado temporalmente (intento de redención)
    REDEEMED = 'REDEEMED',      // Código redimido permanentemente
    EXPIRED = 'EXPIRED',        // Código expirado
}

export enum CouponBookStatus {
    ACTIVE = 'ACTIVE',          // Libro activo y disponible
    INACTIVE = 'INACTIVE',      // Libro desactivado
    EXPIRED = 'EXPIRED',        // Libro expirado
    DRAFT = 'DRAFT',            // Libro en borrador
}
