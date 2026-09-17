import { Injectable } from '@nestjs/common';
import { UrgencyLevel } from '@prisma/client';
import { CreateTriageDto } from '../dto/create-triage.dto';

export interface TriageEvaluationResult {
  recommendedUrgency: UrgencyLevel;
  reasoning: string[];
  isCriticalAlert: boolean;
  priorityScore: number;
  safetyDisclaimer: string;
}

@Injectable()
export class TriageEngineService {
  private readonly SAFETY_DISCLAIMER =
    'Clinical Decision Support recommendation only. Does not replace professional clinical assessment. Final clinical authority remains with the clinician.';

  /**
   * Evaluates patient clinical observations, vital signs, and red flags
   * to produce a deterministic, explainable urgency recommendation.
   */
  evaluate(dto: CreateTriageDto): TriageEvaluationResult {
    const redReasons: string[] = [];
    const yellowReasons: string[] = [];

    // 1. Evaluate Red Flags
    if (dto.redFlags) {
      for (const [key, value] of Object.entries(dto.redFlags)) {
        if (value === true) {
          const readableName = this.formatFlagName(key);
          redReasons.push(`Critical red-flag detected: ${readableName}`);
        }
      }
    }

    // 2. Evaluate Vital Signs - Oxygen Saturation (SpO2)
    if (dto.oxygenSaturation !== undefined && dto.oxygenSaturation !== null) {
      if (dto.oxygenSaturation < 90) {
        redReasons.push(
          `SpO2 is ${dto.oxygenSaturation}% (severe hypoxemia < 90%)`,
        );
      } else if (dto.oxygenSaturation <= 94) {
        yellowReasons.push(
          `SpO2 is ${dto.oxygenSaturation}% (moderate hypoxemia 90-94%)`,
        );
      }
    }

    // 3. Evaluate Respiratory Rate (RR)
    if (dto.respiratoryRate > 30) {
      redReasons.push(
        `Respiratory rate is ${dto.respiratoryRate}/min (severe tachypnea > 30)`,
      );
    } else if (dto.respiratoryRate < 8) {
      redReasons.push(
        `Respiratory rate is ${dto.respiratoryRate}/min (critical bradypnea / respiratory depression < 8)`,
      );
    } else if (dto.respiratoryRate >= 21) {
      yellowReasons.push(
        `Respiratory rate is ${dto.respiratoryRate}/min (tachypnea 21-30)`,
      );
    } else if (dto.respiratoryRate < 12) {
      yellowReasons.push(
        `Respiratory rate is ${dto.respiratoryRate}/min (mild bradypnea 8-11)`,
      );
    }

    // 4. Evaluate Pulse Rate (HR)
    if (dto.pulseRate > 130) {
      redReasons.push(
        `Pulse rate is ${dto.pulseRate} bpm (severe tachycardia > 130 bpm)`,
      );
    } else if (dto.pulseRate < 40) {
      redReasons.push(
        `Pulse rate is ${dto.pulseRate} bpm (severe bradycardia < 40 bpm)`,
      );
    } else if (dto.pulseRate > 100) {
      yellowReasons.push(
        `Pulse rate is ${dto.pulseRate} bpm (tachycardia 101-130 bpm)`,
      );
    } else if (dto.pulseRate < 50) {
      yellowReasons.push(
        `Pulse rate is ${dto.pulseRate} bpm (moderate bradycardia 40-50 bpm)`,
      );
    }

    // 5. Evaluate Blood Pressure (SBP / DBP)
    if (dto.systolicBp < 90) {
      redReasons.push(
        `Systolic BP is ${dto.systolicBp} mmHg (severe hypotension / shock < 90 mmHg)`,
      );
    } else if (dto.systolicBp >= 200) {
      redReasons.push(
        `Systolic BP is ${dto.systolicBp} mmHg (hypertensive crisis range >= 200 mmHg)`,
      );
    } else if (dto.systolicBp < 100) {
      yellowReasons.push(
        `Systolic BP is ${dto.systolicBp} mmHg (borderline hypotension 90-99 mmHg)`,
      );
    } else if (dto.systolicBp >= 160) {
      yellowReasons.push(
        `Systolic BP is ${dto.systolicBp} mmHg (stage 2 hypertension >= 160 mmHg)`,
      );
    }

    if (dto.diastolicBp >= 120) {
      redReasons.push(
        `Diastolic BP is ${dto.diastolicBp} mmHg (critical diastolic >= 120 mmHg)`,
      );
    } else if (dto.diastolicBp >= 100) {
      yellowReasons.push(
        `Diastolic BP is ${dto.diastolicBp} mmHg (elevated diastolic >= 100 mmHg)`,
      );
    }

    // 6. Evaluate Temperature
    if (dto.temperature > 40.5) {
      redReasons.push(
        `Temperature is ${dto.temperature}°C (hyperpyrexia > 40.5°C)`,
      );
    } else if (dto.temperature < 35.0) {
      redReasons.push(
        `Temperature is ${dto.temperature}°C (severe hypothermia < 35.0°C)`,
      );
    } else if (dto.temperature >= 38.5) {
      yellowReasons.push(
        `Temperature is ${dto.temperature}°C (high fever >= 38.5°C)`,
      );
    } else if (dto.temperature < 36.0) {
      yellowReasons.push(
        `Temperature is ${dto.temperature}°C (mild hypothermia 35.0-35.9°C)`,
      );
    }

    // 7. Check urgent symptoms if any
    if (dto.symptoms && Array.isArray(dto.symptoms)) {
      for (const symptom of dto.symptoms) {
        const s = symptom.toLowerCase();
        if (
          s.includes('unconscious') ||
          s.includes('seizure') ||
          s.includes('severe chest pain') ||
          s.includes('choking') ||
          s.includes('massive bleed')
        ) {
          redReasons.push(`Critical symptom reported: ${symptom}`);
        } else if (
          s.includes('moderate pain') ||
          s.includes('persistent vomiting') ||
          s.includes('asthma') ||
          s.includes('dizziness')
        ) {
          yellowReasons.push(`Urgent symptom reported: ${symptom}`);
        }
      }
    }

    // 8. Determine Urgency Classification
    let recommendedUrgency: UrgencyLevel;
    let reasoning: string[];
    let isCriticalAlert = false;
    let priorityScore: number;

    if (redReasons.length > 0) {
      recommendedUrgency = UrgencyLevel.RED;
      reasoning = redReasons;
      isCriticalAlert = true;
      priorityScore = 1000000;
    } else if (yellowReasons.length > 0) {
      recommendedUrgency = UrgencyLevel.YELLOW;
      reasoning = yellowReasons;
      isCriticalAlert = false;
      priorityScore = 10000;
    } else {
      recommendedUrgency = UrgencyLevel.GREEN;
      reasoning = [
        'All measured vital signs are within normal clinical thresholds with no critical red flags',
      ];
      isCriticalAlert = false;
      priorityScore = 100;
    }

    return {
      recommendedUrgency,
      reasoning,
      isCriticalAlert,
      priorityScore,
      safetyDisclaimer: this.SAFETY_DISCLAIMER,
    };
  }

  private formatFlagName(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }
}
