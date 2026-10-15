export interface PasswordValidationResult {
  isValid: boolean;
  hasMinLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export interface UsernameValidationResult {
  isValid: boolean;
  hasOnlyLower: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  hasValidLength: boolean;
  error?: string;
}

// Rules mirror the API (nutriscan-api ValidationRules.java); keep both in sync.

// 1. Password Strength Validator (72 = bcrypt's byte limit, enforced by the API)
export function validatePassword(password: string): PasswordValidationResult {
  const hasMinLength = password.length >= 8 && password.length <= 72;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  const isValid =
    hasMinLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumber &&
    hasSpecialChar;

  return {
    isValid,
    hasMinLength,
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    hasSpecialChar,
  };
}

// 2. Username Validator: only a-z, 0-9, _ . - allowed, 3-15 chars.
// Numbers and symbols are optional.
export function validateUsername(username: string): UsernameValidationResult {
  const hasOnlyLower = !/[A-Z]/.test(username) && /^[a-z0-9_.-]+$/.test(username);
  const hasNumber = /[0-9]/.test(username);
  const hasSpecialChar = /[_.-]/.test(username);
  const hasValidLength = username.length >= 3 && username.length <= 15;

  let error = '';
  if (/[A-Z]/.test(username)) {
    error = 'Uppercase letters are not allowed.';
  } else if (!hasOnlyLower) {
    error = 'Only letters a-z, numbers 0-9 and _ . - are allowed.';
  } else if (username.length > 15) {
    error = 'Username cannot exceed 15 characters.';
  } else if (username.length < 3) {
    error = 'Username must be at least 3 characters.';
  }

  const isValid = hasOnlyLower && hasValidLength;

  return {
    isValid,
    hasOnlyLower,
    hasNumber,
    hasSpecialChar,
    hasValidLength,
    error: isValid ? undefined : error,
  };
}