import { v1 as uuid } from 'uuid';

export class GeneratorProvider {
  static uuid(): string {
    return uuid();
  }

  static generateVerificationCode(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  static generatePassword(): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = lowercase.toUpperCase();
    const numbers = '0123456789';

    let text = '';

    for (let i = 0; i < 4; i++) {
      text += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
      text += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
      text += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }

    return text;
  }

  /**
   * generate random string
   * @param length
   */
  static generateRandomString(length: number): string {
    return Math.random()
      .toString(36)
      .replace(/[^\dA-Za-z]+/g, '')
      .slice(0, Math.max(0, length));
  }

  /**
   * Generate coupon code following a pattern
   * @param pattern Pattern with placeholders: {RANDOM}, {NUM}, {ALPHA}, {UUID}
   * @param length Length for random parts (default: 8)
   * @example generateCouponCode('COUPON-{RANDOM}') -> 'COUPON-Ab3K9mXy'
   * @example generateCouponCode('SUMMER-{UUID}') -> 'SUMMER-a1b2c3d4'
   */
  static generateCouponCode(pattern: string, length: number = 8): string {
    // Generate a short UUID (first 8 chars of UUID v4)
    const shortUuid = this.uuid().replace(/-/g, '').substring(0, length);
    
    // Generate random alphanumeric
    const randomAlphaNum = this.generateRandomString(length);
    
    // Generate random number
    const randomNum = Math.floor(Math.random() * Math.pow(10, length)).toString().padStart(length, '0');
    
    // Generate random alpha only
    const randomAlpha = randomAlphaNum.replace(/\d/g, '').padEnd(length, 'X');

    return pattern
      .replace(/{UUID}/g, shortUuid)
      .replace(/{RANDOM}/g, randomAlphaNum)
      .replace(/{NUM}/g, randomNum)
      .replace(/{ALPHA}/g, randomAlpha);
  }

  /**
   * Generate multiple unique coupon codes
   * @param pattern Pattern for codes
   * @param count Number of codes to generate
   * @param existingCodes Array of existing codes to avoid duplicates
   * @param length Length for random parts
   */
  static generateMultipleCouponCodes(
    pattern: string, 
    count: number, 
    existingCodes: string[] = [],
    length: number = 8
  ): string[] {
    const codes = new Set<string>();
    const maxAttempts = count * 10; // Prevent infinite loops
    let attempts = 0;

    while (codes.size < count && attempts < maxAttempts) {
      const code = this.generateCouponCode(pattern, length);
      
      // Check if code is unique (not in existing codes or already generated)
      if (!existingCodes.includes(code) && !codes.has(code)) {
        codes.add(code);
      }
      
      attempts++;
    }

    if (codes.size < count) {
      throw new Error(`Could not generate ${count} unique codes. Generated ${codes.size} codes.`);
    }

    return Array.from(codes);
  }
}
