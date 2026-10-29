import { Prisma } from 'src/generated/prisma/client';
import type { DataOrigin } from 'src/generated/prisma/client';

type DecimalInput = Prisma.Decimal | number | string;

export const DEFAULT_DATA_UNCERTAINTY_PCT: Record<DataOrigin, number> = {
  MEASURED: 5,
  CALCULATED: 15,
  ESTIMATED: 50,
};

const QUANTITY_DECIMALS = 6;
const RESULT_DECIMALS = 3;
const PERCENT_DECIMALS = 2;

export interface LineComputationInput {
  inputQuantity: DecimalInput;
  conversionFactor?: DecimalInput | null;
  feValueKgco2e: DecimalInput;
  feUncertaintyPct?: DecimalInput | null;
  dataUncertaintyPct: DecimalInput;
}

export interface LineComputationResult {
  calcQuantity: Prisma.Decimal;
  resultKgco2e: Prisma.Decimal;
  lineUncertaintyPct: Prisma.Decimal;
}

export interface AssessmentTotals {
  totalKgco2e: Prisma.Decimal;
  totalUncertaintyPct: Prisma.Decimal | null;
}

const toDecimal = (value: DecimalInput): Prisma.Decimal =>
  new Prisma.Decimal(value);

export const computeCalcQuantity = (
  inputQuantity: DecimalInput,
  conversionFactor?: DecimalInput | null,
): Prisma.Decimal => {
  const quantity = toDecimal(inputQuantity);
  const factor =
    conversionFactor === null || conversionFactor === undefined
      ? new Prisma.Decimal(1)
      : toDecimal(conversionFactor);

  return quantity.mul(factor).toDecimalPlaces(QUANTITY_DECIMALS);
};

// Data and emission factor uncertainties are independent: they combine quadratically.
export const combineUncertainties = (
  dataUncertaintyPct: DecimalInput,
  feUncertaintyPct?: DecimalInput | null,
): Prisma.Decimal => {
  const data = toDecimal(dataUncertaintyPct);
  const fe =
    feUncertaintyPct === null || feUncertaintyPct === undefined
      ? new Prisma.Decimal(0)
      : toDecimal(feUncertaintyPct);

  return data.pow(2).add(fe.pow(2)).sqrt().toDecimalPlaces(PERCENT_DECIMALS);
};

export const computeLine = (
  input: LineComputationInput,
): LineComputationResult => {
  const calcQuantity = computeCalcQuantity(
    input.inputQuantity,
    input.conversionFactor,
  );
  const resultKgco2e = calcQuantity
    .mul(toDecimal(input.feValueKgco2e))
    .toDecimalPlaces(RESULT_DECIMALS);
  const lineUncertaintyPct = combineUncertainties(
    input.dataUncertaintyPct,
    input.feUncertaintyPct,
  );

  return { calcQuantity, resultKgco2e, lineUncertaintyPct };
};

// Absolute uncertainties of each line are summed quadratically, then expressed relative to the total.
export const computeAssessmentTotals = (
  lines: { result_kgco2e: DecimalInput; line_uncertainty_pct: DecimalInput }[],
): AssessmentTotals => {
  let total = new Prisma.Decimal(0);
  let sumOfSquaredAbsoluteUncertainties = new Prisma.Decimal(0);

  for (const line of lines) {
    const result = toDecimal(line.result_kgco2e);
    const absoluteUncertainty = result
      .abs()
      .mul(toDecimal(line.line_uncertainty_pct))
      .div(100);

    total = total.add(result);
    sumOfSquaredAbsoluteUncertainties = sumOfSquaredAbsoluteUncertainties.add(
      absoluteUncertainty.pow(2),
    );
  }

  const totalUncertaintyPct = total.isZero()
    ? null
    : sumOfSquaredAbsoluteUncertainties
        .sqrt()
        .div(total.abs())
        .mul(100)
        .toDecimalPlaces(PERCENT_DECIMALS);

  return {
    totalKgco2e: total.toDecimalPlaces(RESULT_DECIMALS),
    totalUncertaintyPct,
  };
};

export const computeReductionKgco2e = (
  calcQuantity: DecimalInput,
  currentFeValueKgco2e: DecimalInput,
  alternativeFeValueKgco2e: DecimalInput,
): Prisma.Decimal =>
  toDecimal(calcQuantity)
    .mul(
      toDecimal(currentFeValueKgco2e).sub(toDecimal(alternativeFeValueKgco2e)),
    )
    .toDecimalPlaces(RESULT_DECIMALS);
