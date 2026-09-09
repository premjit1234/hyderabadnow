// Pure calculation helpers for the buyer-facing financial tools on a
// listing page (src/components/ListingFinancialTools.tsx) — no DB/network
// access, so these run entirely client-side with no round trip.

export type EmiBreakdown = {
  emi: number;
  totalPayment: number;
  totalInterest: number;
};

/** Standard reducing-balance EMI formula. tenureYears in whole/fractional years. */
export function computeEmiBreakdown(principal: number, annualRatePercent: number, tenureYears: number): EmiBreakdown {
  const months = Math.round(tenureYears * 12);
  if (principal <= 0 || months <= 0) return { emi: 0, totalPayment: 0, totalInterest: 0 };

  const monthlyRate = annualRatePercent / 12 / 100;
  const emi =
    monthlyRate === 0
      ? principal / months
      : (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);

  const totalPayment = emi * months;
  return { emi, totalPayment, totalInterest: totalPayment - principal };
}

// Telangana stamp duty + registration fee rates for a straightforward sale
// deed, cross-checked against homefirstindia.com and squareyards.com
// (September 2026): urban (GHMC/municipal corporation) areas charge stamp
// duty 4% + transfer duty 1.5% + registration fee 0.5% (6% total); Gram
// Panchayat (rural) areas charge stamp duty 5.5% + registration fee 2%, with
// no separate transfer duty (7.5% total). Telangana applies no gender
// concession (unlike some other states), so these rates don't vary by buyer.
//
// These are typical rates for a plain sale deed and can vary by the exact
// mandal/corporation, property type, or transaction structure — always
// treat this as an ESTIMATE for planning purposes, not a substitute for
// checking the IGRS Telangana portal (https://registration.telangana.gov.in)
// or a local sub-registrar office before registration. Shown with that
// caveat in the UI (see ListingFinancialTools.tsx) — this file has no
// opinion of its own to add on top of the math.
export const TELANGANA_STAMP_DUTY_RATES = {
  urban: { stampDutyPercent: 4, transferDutyPercent: 1.5, registrationFeePercent: 0.5 },
  rural: { stampDutyPercent: 5.5, transferDutyPercent: 0, registrationFeePercent: 2 },
} as const;

export type StampDutyArea = keyof typeof TELANGANA_STAMP_DUTY_RATES;

export type StampDutyBreakdown = {
  stampDuty: number;
  transferDuty: number;
  registrationFee: number;
  total: number;
};

export function computeStampDuty(propertyValue: number, area: StampDutyArea): StampDutyBreakdown {
  const rates = TELANGANA_STAMP_DUTY_RATES[area];
  if (propertyValue <= 0) return { stampDuty: 0, transferDuty: 0, registrationFee: 0, total: 0 };

  const stampDuty = (propertyValue * rates.stampDutyPercent) / 100;
  const transferDuty = (propertyValue * rates.transferDutyPercent) / 100;
  const registrationFee = (propertyValue * rates.registrationFeePercent) / 100;
  return { stampDuty, transferDuty, registrationFee, total: stampDuty + transferDuty + registrationFee };
}
