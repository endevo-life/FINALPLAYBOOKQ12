import { useMemo } from "react";
import { EMAIL_REGEX } from "../lib/constants";

export interface IdentityDraft {
  name: string;
  email: string;
  consent: boolean;
}

export interface FieldValidation {
  isValid: boolean;
  error: string | null;
}

export interface ValidationResult {
  name: FieldValidation;
  email: FieldValidation;
  consent: FieldValidation;
  isReady: boolean;
}

export function useFormValidation(draft: IdentityDraft): ValidationResult {
  return useMemo(() => {
    const name: FieldValidation = draft.name.trim().length > 0
      ? { isValid: true, error: null }
      : { isValid: false, error: "Please enter your name." };

    const email: FieldValidation = EMAIL_REGEX.test(draft.email.trim())
      ? { isValid: true, error: null }
      : { isValid: false, error: "Please enter a valid email address." };

    const consent: FieldValidation = draft.consent
      ? { isValid: true, error: null }
      : { isValid: false, error: "Consent is required to receive your report." };

    return {
      name,
      email,
      consent,
      isReady: name.isValid && email.isValid && consent.isValid,
    };
  }, [draft.name, draft.email, draft.consent]);
}
