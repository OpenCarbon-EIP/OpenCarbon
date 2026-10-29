import {
  combineUncertainties,
  computeAssessmentTotals,
  computeCalcQuantity,
  computeLine,
  computeReductionKgco2e,
} from 'src/utils/carbon-calculation';

describe('carbon-calculation', () => {
  describe('computeCalcQuantity', () => {
    it('should keep the input quantity when there is no conversion factor', () => {
      expect(computeCalcQuantity(1250.5).toString()).toBe('1250.5');
    });

    it('should apply the conversion factor', () => {
      expect(computeCalcQuantity(10, 2.4).toString()).toBe('24');
    });
  });

  describe('combineUncertainties', () => {
    it('should combine data and factor uncertainties quadratically', () => {
      expect(combineUncertainties(3, 4).toString()).toBe('5');
    });

    it('should use only the data uncertainty when the factor has none', () => {
      expect(combineUncertainties(15, null).toString()).toBe('15');
    });
  });

  describe('computeLine', () => {
    it('should compute emissions as quantity × factor', () => {
      const result = computeLine({
        inputQuantity: 1000,
        feValueKgco2e: 3.17,
        feUncertaintyPct: 4,
        dataUncertaintyPct: 3,
      });

      expect(result.calcQuantity.toString()).toBe('1000');
      expect(result.resultKgco2e.toString()).toBe('3170');
      expect(result.lineUncertaintyPct.toString()).toBe('5');
    });

    it('should round the result to 3 decimals', () => {
      const result = computeLine({
        inputQuantity: 1,
        conversionFactor: 1,
        feValueKgco2e: 0.0012345,
        dataUncertaintyPct: 5,
      });

      expect(result.resultKgco2e.toString()).toBe('0.001');
    });
  });

  describe('computeAssessmentTotals', () => {
    it('should return a zero total and no uncertainty without lines', () => {
      const totals = computeAssessmentTotals([]);

      expect(totals.totalKgco2e.toString()).toBe('0');
      expect(totals.totalUncertaintyPct).toBeNull();
    });

    it('should sum results and combine absolute uncertainties', () => {
      const totals = computeAssessmentTotals([
        { result_kgco2e: 300, line_uncertainty_pct: 10 },
        { result_kgco2e: 400, line_uncertainty_pct: 7.5 },
      ]);

      // sqrt(30² + 30²) / 700 = 6.06 %
      expect(totals.totalKgco2e.toString()).toBe('700');
      expect(totals.totalUncertaintyPct?.toString()).toBe('6.06');
    });
  });

  describe('computeReductionKgco2e', () => {
    it('should compute the saving of switching to the alternative factor', () => {
      expect(computeReductionKgco2e(1000, 3.17, 0.5).toString()).toBe('2670');
    });
  });
});
