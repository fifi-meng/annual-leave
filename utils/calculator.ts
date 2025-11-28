import { addMonths, differenceInDays, getYear, format, getDaysInYear, differenceInYears } from 'date-fns';
import { LeaveEntitlement } from '../types';

/**
 * Gets the annual leave quota based on the "Service Year Index".
 * Index 0 = Service Year 0 (0-1 year)
 * Index 1 = Service Year 1 (1-2 years)
 * Index 2 = Service Year 2 (2-3 years)
 */
const getQuotaForServiceYear = (yearsServedFull: number): number => {
  // User Rule: 0-1 year uses 7 days basis for proportional calc
  if (yearsServedFull < 1) return 7; 

  // Statutory Tiers (Labor Standards Act Art 38)
  if (yearsServedFull >= 1 && yearsServedFull < 2) return 7;   // 1 year+ : 7 days
  if (yearsServedFull >= 2 && yearsServedFull < 3) return 10;  // 2 years+: 10 days
  if (yearsServedFull >= 3 && yearsServedFull < 5) return 14;  // 3 years+: 14 days
  if (yearsServedFull >= 5 && yearsServedFull < 10) return 15; // 5 years+: 15 days
  
  // 10 years+ : 15 + 1 for every year over 10
  if (yearsServedFull >= 10) {
    const days = 16 + (Math.floor(yearsServedFull) - 10);
    return Math.min(30, days);
  }
  
  return 0;
};

export const calculateCalendarSystem = (onboardDate: Date, yearsToProject: number = 5): LeaveEntitlement[] => {
  const entitlements: LeaveEntitlement[] = [];
  
  // 1. Statutory 6-Month Milestone (Fixed 3 days)
  const sixMonthDate = addMonths(onboardDate, 6);
  entitlements.push({
    year: getYear(sixMonthDate),
    periodStart: sixMonthDate,
    periodEnd: addMonths(sixMonthDate, 6),
    days: 3,
    source: '滿半年法定特休',
    calculationDetails: `於 ${format(sixMonthDate, 'yyyy/MM/dd')} 到職滿6個月，依法給予 3 天`,
  });

  // 2. Retrospective Calendar Year System (Simplified/Start-of-Year Basis)
  // Logic: The rate for the entire calculation year is determined by the tenure at the START of that year.
  // This avoids fractional splits (like 9.25) and aligns with the user's request for "7 days" in the 3rd grant year.
  
  const onboardYear = getYear(onboardDate);
  const startGrantYear = onboardYear + 1; 

  for (let i = 0; i < yearsToProject; i++) {
    const grantYear = startGrantYear + i; // e.g., 2027
    const calcYear = grantYear - 1;       // e.g., 2026
    
    const jan1CalcYear = new Date(calcYear, 0, 1);
    const daysInCalcYear = getDaysInYear(jan1CalcYear);
    
    let daysWorked = 0;
    let quota = 0;
    let details = "";

    // Calculate tenure at the START of the calculation year (Jan 1)
    // For the first partial year, we use tenure 0.
    const tenureAtStartOfCalcYear = Math.max(0, differenceInDays(jan1CalcYear, onboardDate) / 365);
    const yearsServedStart = Math.floor(tenureAtStartOfCalcYear);

    // Rate determination
    quota = getQuotaForServiceYear(yearsServedStart);

    if (calcYear === onboardYear) {
      // First partial year
      const daysMissed = differenceInDays(onboardDate, jan1CalcYear);
      daysWorked = Math.max(0, daysInCalcYear - daysMissed);
      
      const entitlement = (quota * daysWorked) / daysInCalcYear;
      const formattedEntitlement = parseFloat(entitlement.toFixed(2));
      
      entitlements.push({
        year: grantYear,
        periodStart: new Date(grantYear, 0, 1),
        periodEnd: new Date(grantYear, 11, 31),
        days: formattedEntitlement,
        source: `${grantYear}年度 (結算${calcYear}年資)`,
        calculationDetails: `[${calcYear}在職${daysWorked}天] ÷ ${daysInCalcYear} × ${quota}日 (滿${yearsServedStart}年級距)`
      });
    } else {
      // Full year
      // Since we are using "Start of Year" logic requested by user, the rate stays constant for the calendar year.
      daysWorked = daysInCalcYear;
      
      entitlements.push({
        year: grantYear,
        periodStart: new Date(grantYear, 0, 1),
        periodEnd: new Date(grantYear, 11, 31),
        days: quota,
        source: `${grantYear}年度 (結算${calcYear}年資)`,
        calculationDetails: `[${calcYear}全年都在職] 依 1/1 年資滿 ${yearsServedStart} 年級距計算 (${quota}日)`
      });
    }
  }

  return entitlements.sort((a, b) => a.year - b.year);
};