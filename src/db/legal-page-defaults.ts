// Starting content for the three fixed legal pages (Terms of Use, Privacy
// Policy, Cookie Policy), inserted the first time each is missing (see
// seed.ts for brand-new installs, ensure-legal-pages.ts for existing ones).
//
// This is a generic starter template written for a Hyderabad property
// listings marketplace — NOT legal advice. The admin should have it reviewed
// by a lawyer familiar with Indian law (including the IT Act, the Digital
// Personal Data Protection Act 2023, and RERA where relevant) and edit it
// from /admin/legal-pages before relying on it.
//
// Content is plain text, not HTML/markdown: a blank line starts a new
// paragraph, and a line starting with "## " renders as a section heading —
// see components/LegalContent.tsx.
export const LEGAL_PAGE_DEFAULTS = [
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
