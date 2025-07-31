import { z } from 'zod';

export const emailSchema = z.string().email('Invalid email address');

export const urlSchema = z.string().url('Invalid URL');

export const phoneSchema = z
  .string()
  .regex(
    /^[+]?[(]?[0-9]{1,3}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/,
    'Invalid phone number',
  );

export const postalCodeSchema = z.string().regex(/^[A-Z0-9]{3,10}$/i, 'Invalid postal code');

export const skuSchema = z
  .string()
  .regex(/^[A-Z0-9\-_]+$/i, 'SKU must contain only letters, numbers, hyphens, and underscores');

export function validateEtsyListingTitle(title: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (title.length < 1) {
    errors.push('Title cannot be empty');
  }
  if (title.length > 140) {
    errors.push('Title must be 140 characters or less');
  }
  if (title.includes('  ')) {
    errors.push('Title should not contain multiple consecutive spaces');
  }
  if (/[<>]/.test(title)) {
    errors.push('Title cannot contain < or > characters');
  }

  return { valid: errors.length === 0, errors };
}

export function validateEtsyTags(tags: string[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (tags.length > 13) {
    errors.push('Maximum 13 tags allowed');
  }

  tags.forEach((tag, index) => {
    if (tag.length > 20) {
      errors.push(`Tag ${index + 1} exceeds 20 character limit`);
    }
    if (!/^[a-z0-9 ]+$/i.test(tag)) {
      errors.push(`Tag ${index + 1} contains invalid characters`);
    }
  });

  return { valid: errors.length === 0, errors };
}

export function isValidImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(urlObj.pathname);
  } catch {
    return false;
  }
}
