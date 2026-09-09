"use client";

import { useMemo, useState } from "react";
import { computeEmiBreakdown, computeStampDuty, type StampDutyArea } from "@/lib/finance";
import { formatRupees } from "@/lib/format";

// Two purely client-side calculators (no server round trip — see
// lib/finance.ts for the math) shown on a for-sale listing's page: an
// EMI/home-loan calculator and a Telangana stamp duty + registration
// estimator. Both default from the listing's own price so a buyer sees a
// realistic number immediately, then can adjust every input.
export default function ListingFinancialTools({ price }: { price: number }) {
  const [tab, setTab] = useState<"emi" | "stamp">("emi");

  const [propertyPrice, setPropertyPrice] = useState(String(price));
  const [downPaymentPercent, setDownPaymentPercent] = useState("20");
  const [interestRate, setInterestRate] = useState("8.5");
  const [tenureYears, setTenureYears] = useState("20");

  const [stampValue, setStampValue] = useState(String(price));
  const [area, setArea] = useState<StampDutyArea>("urban");

  const emi = useMemo(() => {
    const p = Number(propertyPrice) || 0;
    const dp = Math.min(100, Math.max(0, Number(downPaymentPercent) || 0));
    const loanAmount = p * (1 - dp / 100);
    return { loanAmount, ...computeEmiBreakdown(loanAmount, Number(interestRate) || 0, Number(tenureYears) || 1) };
  }, [propertyPrice, downPaymentPercent, interestRate, tenureYears]);

  const stampDuty = useMemo(() => computeStampDuty(Number(stampValue) || 0, area), [stampValue, area]);

  const inputClass = "w-full rounded-md border border-stone-200 px-3 py-2 text-sm";
  const labelClass = "mb-1 block text-xs font-medium text-stone-600";

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-lg font-bold text-stone-900">Cost Calculators</h2>
      <div className="mb-4 inline-flex rounded-md border border-stone-200 bg-stone-50 p-0.5">
        <button
          type="button"
          onClick={() => setTab("emi")}
          className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
            tab === "emi" ? "bg-stone-900 text-white" : "text-stone-600 hover:text-stone-900"
          }`}
        >
          EMI Calculator
        </button>
        <button
          type="button"
          onClick={() => setTab("stamp")}
          className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
            tab === "stamp" ? "bg-stone-900 text-white" : "text-stone-600 hover:text-stone-900"
          }`}
        >
          Stamp Duty &amp; Registration
        </button>
      </div>

      {tab === "emi" ? (
        <div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className={labelClass}>Property price (₹)</label>
              <input
                type="number"
                value={propertyPrice}
                onChange={(e) => setPropertyPrice(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Down payment (%)</label>
              <input
                type="number"
                value={downPaymentPercent}
                onChange={(e) => setDownPaymentPercent(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Interest rate (% p.a.)</label>
              <input
                type="number"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Tenure (years)</label>
              <input type="number" value={tenureYears} onChange={(e) => setTenureYears(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg bg-emerald-50 p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-stone-500">Loan amount</p>
              <p className="text-lg font-bold text-stone-900">{formatRupees(emi.loanAmount)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-stone-500">Monthly EMI</p>
              <p className="text-lg font-bold text-emerald-700">{formatRupees(emi.emi)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-stone-500">Total interest</p>
              <p className="text-lg font-bold text-stone-900">{formatRupees(emi.totalInterest)}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-stone-500">
            Estimate only, for planning purposes — your actual rate and eligibility depend on the lender and your
            financial profile. Not financial advice.
          </p>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Property value (₹)</label>
              <input type="number" value={stampValue} onChange={(e) => setStampValue(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Area type</label>
              <select value={area} onChange={(e) => setArea(e.target.value as StampDutyArea)} className={inputClass}>
                <option value="urban">Urban (GHMC / Municipal Corporation)</option>
                <option value="rural">Rural (Gram Panchayat)</option>
              </select>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-emerald-50 p-4 sm:grid-cols-4">
            <div>
              <p className="text-xs font-medium text-stone-500">Stamp duty</p>
              <p className="text-base font-bold text-stone-900">{formatRupees(stampDuty.stampDuty)}</p>
            </div>
            {area === "urban" && (
              <div>
                <p className="text-xs font-medium text-stone-500">Transfer duty</p>
                <p className="text-base font-bold text-stone-900">{formatRupees(stampDuty.transferDuty)}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-stone-500">Registration fee</p>
              <p className="text-base font-bold text-stone-900">{formatRupees(stampDuty.registrationFee)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-stone-500">Total payable</p>
              <p className="text-base font-bold text-emerald-700">{formatRupees(stampDuty.total)}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-stone-500">
            Based on typical Telangana sale-deed rates (urban: 4% stamp duty + 1.5% transfer duty + 0.5%
            registration; rural: 5.5% stamp duty + 2% registration) — an estimate for planning, not a substitute for
            checking exact charges on the{" "}
            <a
              href="https://registration.telangana.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 hover:underline"
            >
              IGRS Telangana portal
            </a>{" "}
            or with your sub-registrar office before registration.
          </p>
        </div>
      )}
    </div>
  );
}
