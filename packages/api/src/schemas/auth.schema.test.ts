import { describe, expect, it } from 'vitest';
import { PASSWORD_RULES, PasswordSchema, RegisterSchema } from './auth.schema';

const failedRules = (password: string) => PASSWORD_RULES.filter((rule) => !rule.test(password)).map((r) => r.label);

describe('PasswordSchema (miroir de @IsStrongPassword)', () => {
  it('accepte un mot de passe qui respecte toutes les règles', () => {
    expect(PasswordSchema.safeParse('Secret12!').success).toBe(true);
  });

  it.each([
    ['Sec12!', '8 caractères minimum'],
    ['SECRET12!', 'Une minuscule'],
    ['secret12!', 'Une majuscule'],
    ['Secretxx!', 'Un chiffre'],
    ['Secret123', 'Un symbole'],
  ])('rejette %s (%s)', (password, rule) => {
    expect(PasswordSchema.safeParse(password).success).toBe(false);
    expect(failedRules(password)).toEqual([rule]);
  });

  it('ne compte pas une lettre accentuée comme symbole', () => {
    expect(failedRules('Secret12é')).toEqual(['Un symbole']);
  });
});

describe('RegisterSchema', () => {
  const base = { email: 'a@opencarbon.dev', password: 'Secret12!' };

  it('exige les champs consultant pour le rôle CONSULTANT', () => {
    const result = RegisterSchema.safeParse({ ...base, role: 'CONSULTANT', first_name: 'Ada' });
    expect(result.success).toBe(false);
  });

  it("retire les champs de l'autre rôle", () => {
    const result = RegisterSchema.parse({ ...base, role: 'COMPANY', company_name: 'Acme', first_name: 'Ada' });
    expect(result).not.toHaveProperty('first_name');
  });
});
