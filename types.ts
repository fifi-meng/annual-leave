export interface LeaveEntitlement {
  year: number;
  periodStart: Date;
  periodEnd: Date;
  days: number;
  source: string; // e.g., "滿半年", "2024年度比例"
  calculationDetails: string; // e.g., "7天 * (9/12)"
  totalDaysInYear?: number;
}

export interface CalculationResult {
  employeeName: string;
  onboardDate: Date;
  sixMonthDate: Date;
  sixMonthEntitlement: number;
  calendarYearEntitlements: LeaveEntitlement[];
}

export interface StatutoryRule {
  yearsServed: number; // The threshold (e.g., 0.5, 1, 2)
  days: number;
}