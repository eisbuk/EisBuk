/**
 * Check if the phone string is a valid phone number
 */
export const isValidPhoneNumber = (phone?: string): boolean =>
  !phone ? false : /^(\+|00)[0-9]{9,16}$/.test(phone.replace(/\s/g, ""));
