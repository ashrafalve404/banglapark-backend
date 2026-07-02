import { calculateDailyBenefit, BENEFIT_TIERS } from '../../modules/daily-benefit/daily-benefit.service';

describe('calculateDailyBenefit', () => {
    it('returns 0 below minimum threshold (< 5)', () => {
        expect(calculateDailyBenefit(0)).toBe(0);
        expect(calculateDailyBenefit(4)).toBe(0);
    });

    it('returns 100 for exactly 5 active team members', () => {
        expect(calculateDailyBenefit(5)).toBe(100);
    });

    it('returns 100 for 10 active team members (below 20 tier)', () => {
        expect(calculateDailyBenefit(10)).toBe(100);
    });

    it('returns 200 for exactly 20 active team members', () => {
        expect(calculateDailyBenefit(20)).toBe(200);
    });

    it('returns 300 for 50 active team members', () => {
        expect(calculateDailyBenefit(50)).toBe(300);
    });

    it('returns 500 for 100 active team members', () => {
        expect(calculateDailyBenefit(100)).toBe(500);
    });

    it('returns 1000 for 500 active team members', () => {
        expect(calculateDailyBenefit(500)).toBe(1000);
    });

    it('returns 2000 for 5000 active team members', () => {
        expect(calculateDailyBenefit(5000)).toBe(2000);
    });

    it('returns 5000 for 10000 active team members', () => {
        expect(calculateDailyBenefit(10000)).toBe(5000);
    });

    it('returns highest tier for extreme values', () => {
        expect(calculateDailyBenefit(99999)).toBe(5000);
    });

    it('BENEFIT_TIERS is sorted descending by minCount', () => {
        for (let i = 0; i < BENEFIT_TIERS.length - 1; i++) {
            expect(BENEFIT_TIERS[i].minCount).toBeGreaterThan(BENEFIT_TIERS[i + 1].minCount);
        }
    });
});
