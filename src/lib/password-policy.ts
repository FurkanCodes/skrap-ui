import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

const HAS_LOWERCASE = /[a-z]/;
const HAS_UPPERCASE = /[A-Z]/;
const HAS_NUMBER = /\d/;
const HAS_SYMBOL = /[^A-Za-z0-9]/;
const HAS_WHITESPACE = /\s/;

export const PASSWORD_POLICY_HINT =
  "Use 12+ characters with upper/lowercase letters, a number, and a symbol.";

export function getPasswordPolicyError(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`;
  }

  if (HAS_WHITESPACE.test(password)) {
    return "Password cannot contain spaces.";
  }

  if (!HAS_LOWERCASE.test(password)) {
    return "Password must include at least one lowercase letter.";
  }

  if (!HAS_UPPERCASE.test(password)) {
    return "Password must include at least one uppercase letter.";
  }

  if (!HAS_NUMBER.test(password)) {
    return "Password must include at least one number.";
  }

  if (!HAS_SYMBOL.test(password)) {
    return "Password must include at least one symbol.";
  }

  return null;
}

export const securePasswordSchema = z
  .string()
  .min(1, "Please enter your password.")
  .superRefine((value, context) => {
    const error = getPasswordPolicyError(value);
    if (!error) {
      return;
    }

    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: error,
    });
  });
