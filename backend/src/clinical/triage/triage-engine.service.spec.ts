import { TriageEngineService } from './triage-engine.service';
import { UrgencyLevel } from '@prisma/client';

describe('TriageEngineService', () => {
  let service: TriageEngineService;

  beforeEach(() => {
    service = new TriageEngineService();
  });

  describe('Urgency Classification: RED (Critical / Immediate Attention)', () => {
    it('should classify as RED when SpO2 is < 90%', () => {
      const result = service.evaluate({
        temperature: 37.0,
        systolicBp: 120,
        diastolicBp: 80,
        pulseRate: 75,
        respiratoryRate: 18,
        oxygenSaturation: 87, // Critical hypoxemia
      });

      expect(result.recommendedUrgency).toBe(UrgencyLevel.RED);
      expect(result.isCriticalAlert).toBe(true);
      expect(result.priorityScore).toBe(1000000);
      expect(result.reasoning.some((r) => r.includes('SpO2 is 87%'))).toBe(
        true,
      );
      expect(result.safetyDisclaimer).toBeDefined();
    });

    it('should classify as RED when severe respiratory distress red flag is active', () => {
      const result = service.evaluate({
        temperature: 37.0,
        systolicBp: 120,
        diastolicBp: 80,
        pulseRate: 80,
        respiratoryRate: 20,
        redFlags: {
          severeRespiratoryDistress: true,
        },
      });

      expect(result.recommendedUrgency).toBe(UrgencyLevel.RED);
      expect(result.isCriticalAlert).toBe(true);
      expect(
        result.reasoning.some((r) =>
          r.includes('Critical red-flag detected: Severe Respiratory Distress'),
        ),
      ).toBe(true);
    });

    it('should classify as RED for severe bradycardia (< 40 bpm) or severe tachycardia (> 130 bpm)', () => {
      const bradycardia = service.evaluate({
        temperature: 36.8,
        systolicBp: 110,
        diastolicBp: 70,
        pulseRate: 34, // Severe bradycardia
        respiratoryRate: 16,
      });
      expect(bradycardia.recommendedUrgency).toBe(UrgencyLevel.RED);
      expect(
        bradycardia.reasoning.some((r) => r.includes('severe bradycardia')),
      ).toBe(true);

      const tachycardia = service.evaluate({
        temperature: 36.8,
        systolicBp: 110,
        diastolicBp: 70,
        pulseRate: 145, // Severe tachycardia
        respiratoryRate: 16,
      });
      expect(tachycardia.recommendedUrgency).toBe(UrgencyLevel.RED);
      expect(
        tachycardia.reasoning.some((r) => r.includes('severe tachycardia')),
      ).toBe(true);
    });

    it('should classify as RED for hypotensive shock (SBP < 90 mmHg)', () => {
      const result = service.evaluate({
        temperature: 36.5,
        systolicBp: 78, // Severe hypotension
        diastolicBp: 45,
        pulseRate: 115,
        respiratoryRate: 22,
      });

      expect(result.recommendedUrgency).toBe(UrgencyLevel.RED);
      expect(result.isCriticalAlert).toBe(true);
      expect(
        result.reasoning.some((r) => r.includes('severe hypotension')),
      ).toBe(true);
    });

    it('should classify as RED for hyperpyrexia (> 40.5°C)', () => {
      const result = service.evaluate({
        temperature: 41.2,
        systolicBp: 125,
        diastolicBp: 82,
        pulseRate: 90,
        respiratoryRate: 18,
      });

      expect(result.recommendedUrgency).toBe(UrgencyLevel.RED);
      expect(result.reasoning.some((r) => r.includes('hyperpyrexia'))).toBe(
        true,
      );
    });
  });

  describe('Urgency Classification: YELLOW (Urgent / Timely Attention)', () => {
    it('should classify as YELLOW for moderate hypoxemia (SpO2 90-94%)', () => {
      const result = service.evaluate({
        temperature: 37.2,
        systolicBp: 125,
        diastolicBp: 80,
        pulseRate: 85,
        respiratoryRate: 20,
        oxygenSaturation: 92,
      });

      expect(result.recommendedUrgency).toBe(UrgencyLevel.YELLOW);
      expect(result.isCriticalAlert).toBe(false);
      expect(result.priorityScore).toBe(10000);
      expect(result.reasoning.some((r) => r.includes('SpO2 is 92%'))).toBe(
        true,
      );
    });

    it('should classify as YELLOW for high fever (38.5 - 40.4°C)', () => {
      const result = service.evaluate({
        temperature: 39.1,
        systolicBp: 120,
        diastolicBp: 80,
        pulseRate: 95,
        respiratoryRate: 18,
      });

      expect(result.recommendedUrgency).toBe(UrgencyLevel.YELLOW);
      expect(result.reasoning.some((r) => r.includes('high fever'))).toBe(true);
    });

    it('should classify as YELLOW for tachypnea (RR 21 - 30)', () => {
      const result = service.evaluate({
        temperature: 37.0,
        systolicBp: 120,
        diastolicBp: 80,
        pulseRate: 82,
        respiratoryRate: 26,
      });

      expect(result.recommendedUrgency).toBe(UrgencyLevel.YELLOW);
      expect(result.reasoning.some((r) => r.includes('tachypnea 21-30'))).toBe(
        true,
      );
    });
  });

  describe('Urgency Classification: GREEN (Stable / Non-Urgent)', () => {
    it('should classify as GREEN when all vitals are within normal range and no red flags exist', () => {
      const result = service.evaluate({
        temperature: 36.8,
        systolicBp: 120,
        diastolicBp: 80,
        pulseRate: 72,
        respiratoryRate: 16,
        oxygenSaturation: 98,
      });

      expect(result.recommendedUrgency).toBe(UrgencyLevel.GREEN);
      expect(result.isCriticalAlert).toBe(false);
      expect(result.priorityScore).toBe(100);
      expect(result.reasoning[0]).toContain(
        'within normal clinical thresholds',
      );
    });
  });

  describe('Clinical Safety & Regulatory Requirements', () => {
    it('should always include the safety disclaimer clarifying decision-support boundaries', () => {
      const result = service.evaluate({
        temperature: 36.8,
        systolicBp: 120,
        diastolicBp: 80,
        pulseRate: 72,
        respiratoryRate: 16,
      });

      expect(result.safetyDisclaimer).toContain(
        'Clinical Decision Support recommendation only',
      );
      expect(result.safetyDisclaimer).toContain(
        'Final clinical authority remains with the clinician',
      );
    });
  });
});
