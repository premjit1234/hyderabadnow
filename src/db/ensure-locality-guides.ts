// One-off, safe-to-rerun seed for the initial batch of locality/area guides
// (see schema.ts's localityGuides table and /admin/locality-guides). Only
// inserts when the table is completely empty — once an admin creates, edits,
// or deletes any guide through the admin UI, this becomes a permanent no-op,
// exactly like ensure-home-tiles.ts and the other ensure-*.ts scripts. Safe
// to run on every container start (see docker-entrypoint.sh).
//
// Content below is sourced, dated research (Metro Phase 2 corridor status,
// ORR exit numbers, Regional Ring Road and Pharma City/Future City status)
// current as of early 2026 — see the disclaimer footer on every /areas/[slug]
// page. No numeric claims (prices, timelines) are asserted beyond what's
// publicly confirmed.
import { sql } from "drizzle-orm";
import { db } from "./client";
import { localityGuides } from "./schema";

const INFRA_NOTE =
  "<p><em>Two bigger, city-wide projects are also worth tracking, though neither touches these localities directly yet: the 340&nbsp;km Regional Ring Road around the outer edge of the city, and the Mucherla “Pharma City” project (recently reorganised under the state's Future City Development Authority) far to the south-east. Both are still in the planning/land-acquisition stage as of early 2026, with no confirmed completion date.</em></p>";

const GUIDES = [
  {
    slug: "gachibowli",
    name: "Gachibowli",
    title: "Gachibowli, Hyderabad — Complete Area Guide",
    excerpt:
      "IT-corridor hub next to HITEC City with strong ORR access — what buyers and renters should know about connectivity, and what's actually coming next.",
    metroConnectivity:
      "No metro station sits directly in Gachibowli today — the nearest is Raidurg on the Blue Line, a few kilometres away. A proposed Metro Phase 2 spur would eventually bring the Blue Line closer to the neighbouring Financial District, but that corridor is still at the unapproved proposal stage.",
    orrAccess:
      "Gachibowli sits just inside the Outer Ring Road, between the Kokapet (Exit 1) and Nanakramguda (Exit 19) interchanges — quick access onto the ORR toward Shamshabad Airport one way, and Kukatpally/Kompally the other.",
    upcomingInfra:
      "Metro Phase 2 (which would eventually serve this side of the city) and the Regional Ring Road are both still in the planning/DPR stage as of early 2026 — worth tracking, but neither has a confirmed construction start date.",
    contentHtml: `
<p>Gachibowli is the original anchor of Hyderabad's western IT corridor — HITEC City, a cluster of large campus offices (Microsoft, Wipro, Deloitte and others have had a presence here over the years), and the University of Hyderabad all sit within a few kilometres of each other. That job density is the main reason it became, and largely remains, one of the most searched-for residential addresses in the city.</p>
<h2>What it's like to live here</h2>
<p>The locality has matured from mostly-commercial to a genuine residential neighbourhood over the last decade: a mix of gated-community apartment complexes, some independent villas, and a growing retail/restaurant scene serving the IT workforce. Traffic on the internal roads during office hours is the most common complaint from residents — a direct trade-off for being this close to the job hubs.</p>
<h2>Who tends to buy or rent here</h2>
<p>Primarily IT and consulting professionals working in the surrounding campuses, plus a steady stream of NRI buyers purchasing as an investment or for eventual return-to-Hyderabad plans, given the locality's long track record and easy resale demand.</p>
${INFRA_NOTE}
`,
    displayOrder: 1,
  },
  {
    slug: "kokapet",
    name: "Kokapet",
    title: "Kokapet, Hyderabad — Complete Area Guide",
    excerpt:
      "One of Hyderabad's fastest-growing western suburbs, known for HMDA's high-value Neopolis land auctions and direct ORR access.",
    metroConnectivity:
      "Like Gachibowli, Kokapet has no metro station yet — Raidurg (Blue Line) is the nearest, a longer drive than from Gachibowli itself. No Metro Phase 2 proposal currently routes directly through Kokapet.",
    orrAccess:
      "Kokapet is served directly by ORR Exit 1, making it one of the more directly-connected western localities — a short hop onto the ring road without needing to cut through Gachibowli traffic first.",
    upcomingInfra:
      "The Regional Ring Road remains in the planning/DPR stage with no confirmed timeline as of early 2026. Locally, HMDA's phased Neopolis layout auctions continue to shape how much new high-rise and villa inventory comes onto the market here year to year.",
    contentHtml: `
<p>Kokapet became one of the most talked-about addresses in Hyderabad real estate after HMDA's Neopolis layout auctions attracted some of the highest per-acre land prices the city had seen, drawing in large branded residential and commercial developments in quick succession.</p>
<h2>What it's like to live here</h2>
<p>Expect a newer, still-developing feel compared to established Gachibowli — wide internal roads built for the new layouts, a growing number of high-rise apartment towers and villa communities, and construction activity that's likely to continue for several more years as remaining plots get built out.</p>
<h2>Who tends to buy or rent here</h2>
<p>A mix of end-users moving out from more congested parts of Gachibowli/Madhapur, and investors drawn by the area's rapid appreciation story — though, as with any fast-growing layout, it's worth checking a specific project's approvals and completion stage carefully rather than assuming the whole area is equally built-out.</p>
${INFRA_NOTE}
`,
    displayOrder: 2,
  },
  {
    slug: "tellapur",
    name: "Tellapur",
    title: "Tellapur, Hyderabad — Complete Area Guide",
    excerpt:
      "A quieter, fast-developing pocket along the Mumbai Highway (NH65) just past Gachibowli, popular for gated-community apartments.",
    metroConnectivity:
      "No metro station serves Tellapur directly today. Some Metro Phase 2 discussion has floated an eventual extension toward Tellapur/Kollur, but this is unconfirmed and, if it happens at all, years away.",
    orrAccess:
      "Tellapur is reached via NH65 (the Mumbai Highway) and sits closer to the Patancheru side of the Outer Ring Road than the Gachibowli/Kokapet cluster — a longer drive to the Financial District than Kokapet, but generally quieter and comparatively priced.",
    upcomingInfra:
      "Growth here is currently driven more by spillover demand from Gachibowli/Kondapur than by any single confirmed infrastructure project — the Regional Ring Road and any Metro Phase 2 extension both remain in early planning as of 2026.",
    contentHtml: `
<p>Tellapur has grown up as an overflow destination for people priced out of, or simply looking for more space than, Gachibowli and Kondapur — while still keeping a reasonable commute to the IT corridor via NH65.</p>
<h2>What it's like to live here</h2>
<p>Mostly large gated-community apartment complexes with more generous open space and amenities than older, denser parts of the corridor, plus a number of schools that have opened in the area specifically to serve this growing population of young families.</p>
<h2>Who tends to buy or rent here</h2>
<p>Families and mid-to-senior IT professionals prioritising space and a newer building stock over being at the absolute centre of the job cluster — commonly people who already work in or near Gachibowli but want a calmer neighbourhood to come home to.</p>
${INFRA_NOTE}
`,
    displayOrder: 3,
  },
  {
    slug: "financial-district",
    name: "Financial District",
    title: "Financial District (Nanakramguda), Hyderabad — Complete Area Guide",
    excerpt:
      "Hyderabad's dedicated financial and IT services district, anchored by Nanakramguda — the one locality here with a concrete (if still unbuilt) metro plan.",
    metroConnectivity:
      "This is the one locality among our guides with an actual named metro proposal: Metro Phase 2's Blue Line spur would run roughly 8 km from Raidurg via Biodiversity Junction and Nanakramguda toward the American Consulate. It was part of the DPR submitted to the state government back in 2020 and remains unapproved, with no construction start date set as of early 2026.",
    orrAccess:
      "Financial District/Nanakramguda has its own dedicated ORR interchange — Exit 19 — making it one of the most directly ORR-connected employment hubs in the city, alongside Kokapet on the opposite side of Gachibowli.",
    upcomingInfra:
      "The Blue Line metro spur described above is the headline project to watch for this specific locality. It's still a proposal, not funded construction — treat any “metro coming soon” claim from a seller with appropriate caution until official tenders are actually issued.",
    contentHtml: `
<p>The Financial District was purpose-built as Hyderabad's dedicated hub for banking, financial services, and IT/ITES campuses, distinct from — but immediately next to — Gachibowli. Nanakramguda is the commercial heart of the area, home to a dense cluster of large corporate campuses.</p>
<h2>What it's like to live here</h2>
<p>Residential development here skews toward premium high-rise apartments aimed at senior professionals working in the surrounding campuses, with a shorter commute being the main selling point over more residential-first neighbourhoods like Tellapur.</p>
<h2>Who tends to buy or rent here</h2>
<p>Senior IT/finance professionals and NRI investors specifically targeting proximity to this employment cluster — often willing to pay a premium for the shorter commute and the area's newer building stock.</p>
${INFRA_NOTE}
`,
    displayOrder: 4,
  },
];

async function main() {
  const existing = await db.select({ id: localityGuides.id }).from(localityGuides).limit(1);
  if (existing.length > 0) {
    console.log("Locality guides already present — nothing to do.");
    return;
  }

  await db.insert(localityGuides).values(
    GUIDES.map((g) => ({
      ...g,
      status: "published" as const,
      publishedAt: sql`(current_timestamp)`,
    }))
  );
  console.log(`Inserted ${GUIDES.length} default locality guides: ${GUIDES.map((g) => g.slug).join(", ")}.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
