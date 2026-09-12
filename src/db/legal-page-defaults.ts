// Starting content for the four "legal_pages" rows (NRI Guide, Terms of Use,
// Privacy Policy, Cookie Policy), inserted the first time each is missing
// (see seed.ts for brand-new installs, ensure-legal-pages.ts for existing
// ones).
//
// The three legal ones are a generic starter template for a Hyderabad
// property listings marketplace — NOT legal advice. The admin should have it
// reviewed by a lawyer familiar with Indian law (including the IT Act, the
// Digital Personal Data Protection Act 2023, and RERA where relevant) and
// edit it from /admin/legal-pages before relying on it.
//
// The NRI guide is sourced, dated general information (RBI/FEMA repatriation
// limits, Section 195 TDS rates, the Section 197/Form 13 lower-deduction
// route) current as of 2026 — NOT tax or legal advice either; see its own
// closing section and the disclaimer on /nri-guide.
//
// Content is plain text, not HTML/markdown: a blank line starts a new
// paragraph, and a line starting with "## " renders as a section heading —
// see components/LegalContent.tsx.
export const LEGAL_PAGE_DEFAULTS = [
  {
    slug: "nri-guide" as const,
    title: "NRI Guide",
    content: `## 1. Can NRIs buy property in India?
Yes. NRIs and OCIs can buy most residential and commercial property in India under FEMA rules, without needing RBI's prior permission for these categories. The one broad restriction: agricultural land, farmhouses, and plantation property generally can't be purchased by an NRI/OCI — a specific RBI approval route exists for exceptions, but it isn't the norm. This guide focuses on what NRI buyers and sellers ask about most: repatriating sale proceeds, and how property income and gains are taxed.

## 2. Repatriating sale proceeds — how much, and how
When an NRI sells a property in India, the proceeds can be repatriated (transferred back abroad) subject to conditions set by the Reserve Bank of India under FEMA. As of 2026, the well-established ceiling is USD 1 million per financial year for remittance of sale or inherited property proceeds through an authorised dealer bank, once applicable taxes have been paid — a higher amount needs specific RBI approval. Proceeds are typically routed through an NRO (Non-Resident Ordinary) account, since a property bought with rupee funds is usually treated as NRO money; property originally bought with foreign remittance or NRE funds can have different, sometimes more generous, repatriation treatment. Two forms come up constantly in this process: Form 15CA (an online self-declaration) and, for larger remittances, Form 15CB (a certificate from a practising chartered accountant confirming the correct tax has been paid) — your bank will typically ask for these before releasing funds abroad.

## 3. TDS when an NRI sells property
This is the single biggest surprise for NRI sellers: when someone buys property from an NRI, the buyer must deduct TDS under Section 195 — and unlike a resident-to-resident sale (where TDS is a flat 1% on the sale value), for an NRI seller the default is to deduct TDS on the full sale consideration at the seller's applicable capital-gains rate, not just on the profit. As of 2026: property held for more than 24 months qualifies as a long-term capital gain, currently taxed at 12.5% (without indexation, following the Budget 2024 change) plus applicable surcharge and a 4% health and education cess; property held 24 months or less is a short-term gain, commonly deducted at a flat 30% plus surcharge and cess in the absence of other arrangements. Because TDS is otherwise withheld on the full sale price rather than the actual gain, many NRI sellers apply in advance for a Lower or Nil TDS Certificate under Section 197 (filed as Form 13 with the Assessing Officer) — an approved certificate instructs the buyer to deduct TDS only on the estimated real gain, which can make a large practical difference to how much cash is tied up until the next tax return is filed and any excess is refunded.

## 4. Rental income and double taxation
If an NRI keeps a property and rents it out instead of selling, the tenant (or their managing agent) is generally required to deduct TDS on rent paid to an NRI landlord under Section 195, rather than the simpler rate that applies for a resident landlord. Both rental income and capital gains from Indian property remain taxable in India regardless of NRI status. India's tax treaties (Double Taxation Avoidance Agreements, or DTAA) with most countries NRIs commonly live in typically allow a credit for tax already paid in India against tax owed in the country of residence, so the same income usually isn't taxed twice in full — but claiming that credit correctly is a return-filing detail worth getting a professional's help with.

## 5. Power of Attorney for remote transactions
Buying, selling, or simply completing paperwork on an Indian property from abroad is common enough that a Power of Attorney (PoA) — a document authorising someone in India, often a relative or a lawyer, to sign and act on the NRI's behalf — is routinely used for site visits, registration formalities, and bank or tax filings. A PoA used for property transactions is usually expected to be notarised and, if executed outside India, attested by the Indian consulate or embassy in that country, then adjudicated/stamped after it arrives in India. Exact requirements vary by state, so this is worth confirming locally before relying on one — and see our video-call viewing option on individual listings as a lower-effort way to see a property before deciding whether a visit (or a PoA-backed transaction) is worth arranging.

## 6. This isn't tax or legal advice
Everything above is general information about how these rules commonly work as of 2026, meant to help NRI buyers and sellers ask the right questions — it is not personalised tax, legal, or financial advice. The specific rates and thresholds mentioned (repatriation limits, TDS rates, holding periods) can and do change with each Union Budget and RBI notification, and how they apply to any specific transaction depends on facts we have no way to know here. Before making a decision, please have your own chartered accountant confirm current TDS/capital-gains treatment, and your own lawyer review any Power of Attorney or sale agreement.`,
  },
  {
    slug: "terms" as const,
    title: "Terms of Use",
    content: `## 1. Acceptance of These Terms
By accessing or using HyderabadNow ("the Site", "we", "us"), you agree to be bound by these Terms of Use. If you do not agree, please do not use the Site.

## 2. What HyderabadNow Is
HyderabadNow is a property listings marketplace that lets agents, developers, and property owners post real estate listings for sale or rent in and around Hyderabad, and lets visitors search and browse those listings. We do not own, manage, broker, or guarantee any property listed on the Site, and we are not a party to any transaction between a listing owner and a prospective buyer or tenant.

## 3. Listings and User Content
Anyone who posts a listing is solely responsible for the accuracy of the information, photos, and pricing they submit. We do not independently verify listing details, ownership, or legal title to any property, except where a listing is explicitly marked "Verified" following an internal review — even then, a "Verified" badge is not a legal or financial guarantee. Always independently verify a property's title, approvals, and documentation before entering into any transaction.

## 4. Account Responsibilities
You are responsible for keeping your account credentials confidential and for all activity under your account. Notify us promptly if you suspect unauthorized use of your account.

## 5. Prohibited Uses
You agree not to post false, misleading, or fraudulent listings; not to use the Site to harass or defraud other users; and not to scrape, copy, or reproduce the Site's listings or content for a competing service without permission.

## 6. Contact Between Users
Contact details (including phone numbers and WhatsApp links) shown on a listing are provided by that listing's owner for genuine property inquiries. Misusing this contact information — for spam, unsolicited marketing, or harassment — is prohibited.

## 7. No Warranty
The Site and its listings are provided "as is" without warranties of any kind, express or implied, including as to accuracy, completeness, or fitness for a particular purpose.

## 8. Limitation of Liability
To the maximum extent permitted by law, HyderabadNow is not liable for any loss or damage arising from your use of the Site or reliance on any listing, including losses arising from a property transaction with a third party.

## 9. Changes to These Terms
We may update these Terms from time to time. Continued use of the Site after a change means you accept the revised Terms.

## 10. Contact Us
Questions about these Terms can be sent to the contact details listed on the Site.`,
  },
  {
    slug: "privacy" as const,
    title: "Privacy Policy",
    content: `## 1. Information We Collect
When you create an account, post a listing, or contact a listing owner, we collect information such as your name, email address, phone number, and any listing details or messages you submit. We also automatically collect basic technical information (like pages visited) to operate and improve the Site.

## 2. How We Use Your Information
We use your information to operate the Site, display your listings, connect you with other users for genuine property inquiries, and communicate with you about your account. We do not sell your personal information to third parties.

## 3. What Other Users Can See
Contact details you choose to add to a listing (such as a phone number or WhatsApp link) are shown publicly on that listing so interested buyers or tenants can reach you directly. Only add contact information you're comfortable sharing publicly.

## 4. Data Retention
We retain account and listing information for as long as your account is active, or as needed to comply with legal obligations, resolve disputes, and enforce our agreements.

## 5. Your Rights
Subject to applicable law (including India's Digital Personal Data Protection Act, 2023), you may request access to, correction of, or deletion of your personal information by contacting us.

## 6. Security
We take reasonable measures to protect your information, but no method of transmission or storage is completely secure, and we cannot guarantee absolute security.

## 7. Children's Privacy
The Site is not directed at children, and we do not knowingly collect personal information from anyone under 18.

## 8. Changes to This Policy
We may update this Privacy Policy from time to time. We'll post the updated version here with a new effective date.

## 9. Contact Us
Questions about this Privacy Policy can be sent to the contact details listed on the Site.`,
  },
  {
    slug: "cookies" as const,
    title: "Cookie Policy",
    content: `## 1. What Are Cookies
Cookies are small text files stored on your device that help websites function and remember information about your visit.

## 2. How We Use Cookies
We use cookies that are necessary for the Site to work — for example, to keep you signed in and to remember your session. We may also use cookies to understand how visitors use the Site so we can improve it.

## 3. Types of Cookies We Use
Essential cookies, required for core features like logging in and posting a listing. Preference cookies, which remember choices you've made, like a search filter. Analytics cookies, which help us understand overall usage patterns.

## 4. Managing Cookies
Most browsers let you control or delete cookies through their settings. Blocking essential cookies may prevent parts of the Site — like signing in — from working correctly.

## 5. Changes to This Policy
We may update this Cookie Policy from time to time. We'll post the updated version here with a new effective date.

## 6. Contact Us
Questions about this Cookie Policy can be sent to the contact details listed on the Site.`,
  },
];
