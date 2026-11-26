// Insert-only seed for a second batch of locality/area guides, adding to
// whatever ensure-locality-guides.ts (or an admin, directly) has already put
// in the locality_guides table. Unlike ensure-locality-guides.ts — which is a
// true one-off that only fires when the table is completely empty — this
// script checks existence PER SLUG and inserts only the guides that aren't
// already there, so it's safe to run against a live database at any time,
// including re-running it later if it fails partway through.
//
//   npm run db:seed-more-locality-guides
//
// Content below is sourced, dated research current as of late 2026 — metro
// status, ORR exit numbers, and named developer/HMDA projects were checked
// against news coverage, HMDA/government notifications, and (where flagged
// as such) developer or portal listings. Where a project or status could not
// be independently confirmed beyond a real-estate portal listing or a
// developer's own marketing, the copy below says so explicitly rather than
// presenting it as confirmed fact. No pricing or timeline claims are made
// beyond what's publicly reported. See the shared INFRA_NOTE footer and the
// fixed disclaimer on every /areas/[slug] page for the standing caution
// about planning-stage megaprojects.
import { sql } from "drizzle-orm";
import { db } from "./client";
import { localityGuides } from "./schema";

const INFRA_NOTE =
  "<p><em>Two bigger, city-wide projects are also worth tracking, though neither touches these localities directly yet: the 340&nbsp;km Regional Ring Road around the outer edge of the city, and the Mucherla “Pharma City” project (recently reorganised under the state's Future City Development Authority) far to the south-east. Both are still in the planning/land-acquisition stage as of early 2026, with no confirmed completion date.</em></p>";

const GUIDES = [
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
<h2>Notable projects and developments</h2>
<p>Prestige Group has a large high-rise project here, Prestige Golden Grove — reported in the trade press as a roughly 5,120-unit development — alongside a number of other gated-community towers from builders such as DSR and Vertex advertised in the area; those smaller listings come from real-estate portals rather than independent news coverage, so treat them as developer-marketed rather than independently confirmed.</p>
${INFRA_NOTE}
`,
    displayOrder: 10,
  },
  {
    slug: "financial-district",
    name: "Financial District",
    title: "Financial District (Nanakramguda), Hyderabad — Complete Area Guide",
    excerpt:
      "Hyderabad's dedicated financial and IT services district, anchored by Nanakramguda — the one locality here with a concrete (if still unbuilt) metro plan.",
    metroConnectivity:
      "This is the one locality among our guides with an actual named metro proposal: Metro Phase 2's Blue Line spur would run roughly 8 km from Raidurg via Biodiversity Junction and Nanakramguda toward the American Consulate. It was part of the DPR submitted to the state government back in 2020 and remains unapproved, with no construction start date set as of early 2026.",
    orrAccess:
      "Financial District/Nanakramguda has its own dedicated ORR interchange — Exit 19 — making it one of the most directly ORR-connected employment hubs in the city, alongside Kokapet on the opposite side of Gachibowli.",
    upcomingInfra:
      "The Blue Line metro spur described above is the headline project to watch for this specific locality. It's still a proposal, not funded construction — treat any “metro coming soon” claim from a seller with appropriate caution until official tenders are actually issued.",
    contentHtml: `
<p>The Financial District was purpose-built as Hyderabad's dedicated hub for banking, financial services, and IT/ITES campuses, distinct from — but immediately next to — Gachibowli. Nanakramguda is the commercial heart of the area, home to a dense cluster of large corporate campuses (including Deloitte, Wells Fargo, and Franklin Templeton).</p>
<h2>What it's like to live here</h2>
<p>Residential development here skews toward premium high-rise apartments aimed at senior professionals working in the surrounding campuses, with a shorter commute being the main selling point over more residential-first neighbourhoods like Tellapur.</p>
<h2>Who tends to buy or rent here</h2>
<p>Senior IT/finance professionals and NRI investors specifically targeting proximity to this employment cluster — often willing to pay a premium for the shorter commute and the area's newer building stock.</p>
<h2>Notable projects and developments</h2>
<p>Named residential towers reported in or marketed under the Financial District/Nanakramguda address include Brigade Nanakramguda (Brigade Group) and Cinq, a newly announced project from the Raghava Group. See our separate Nanakramguda guide for more on the campus-dense commercial core specifically.</p>
${INFRA_NOTE}
`,
    displayOrder: 11,
  },
  {
    slug: "neopolis",
    name: "Neopolis",
    title: "Neopolis (Kokapet), Hyderabad — Complete Area Guide",
    excerpt:
      "HMDA's master-planned IT and residential layout inside Kokapet — the source of some of India's highest-ever recorded land auction prices.",
    metroConnectivity:
      "No metro station serves Neopolis directly — the nearest is Raidurg on the Blue Line, a few kilometres away. No Metro Phase 2 proposal currently routes through Neopolis specifically.",
    orrAccess:
      "Neopolis sits inside the Outer Ring Road and is reached via the Kokapet/Narsingi-side interchanges near Exit 1 — the same general access as the rest of Kokapet.",
    upcomingInfra:
      "HMDA has been running a multi-phase e-auction of Neopolis plots (Phase 1 through Phase 3 as of 2026), repeatedly setting record per-acre prices and drawing large developers — the process itself, not a single building, is the thing to track here.",
    contentHtml: `
<p>Neopolis is the HMDA-planned layout carved out of Kokapet specifically for high-value IT and commercial development, released to the market through a series of government land e-auctions rather than a single master developer.</p>
<h2>What it's like to live here</h2>
<p>Still very much under construction as a neighbourhood — large tracts remain vacant or recently allotted, so expect an active-construction feel for several more years rather than an established residential area. As towers on already-auctioned plots are completed, it's filling in as a premium high-rise commercial-and-residential pocket.</p>
<h2>Who tends to buy or rent here</h2>
<p>At the land level, mainly large developers and institutional buyers acquiring plots at auction; once towers are built, the resulting apartments/offices are aimed at the same premium IT/finance-professional segment as neighbouring Kokapet and the Financial District.</p>
<h2>Notable projects and developments</h2>
<p>HMDA's Neopolis e-auctions have repeatedly made news for their prices — reported figures range from roughly ₹120 crore to over ₹150 crore per acre across different auction rounds, with cumulative HMDA receipts from the program reported in the ₹2,700–3,700 crore range by various 2025–2026 news reports. In the Phase 3 round (around 25 acres), Brigade Enterprises is confirmed to have acquired a 4.04-acre plot. Because this is an ongoing government auction process rather than a single fixed development, expect further phases and new developer names to be announced over time.</p>
${INFRA_NOTE}
`,
    displayOrder: 12,
  },
  {
    slug: "kollur",
    name: "Kollur",
    title: "Kollur, Hyderabad — Complete Area Guide",
    excerpt:
      "A fast-growing residential belt west of Kokapet and Tellapur along NH65, increasingly marketed for villas and large gated communities.",
    metroConnectivity:
      "No metro station serves Kollur, and no Metro Phase 2 proposal currently reaches it.",
    orrAccess:
      "Kollur sits further from the Outer Ring Road than Tellapur or Kokapet and is reached primarily via NH65 and connecting roads — we couldn't confirm a dedicated ORR exit for Kollur itself, so budget extra drive time to the ring road compared with the Gachibowli/Kokapet cluster.",
    upcomingInfra:
      "Kollur is commonly discussed together with Tellapur and Nallagandla as a single fast-appreciating growth belt along NH65, driven by overflow demand from the pricier core of the IT corridor rather than any one named infrastructure project.",
    contentHtml: `
<p>Kollur sits a bit further out from the IT corridor's core than Tellapur, and has grown primarily as a villa and large-gated-community destination for buyers willing to trade a longer commute for more space and a lower entry price.</p>
<h2>What it's like to live here</h2>
<p>A mix of newly built gated apartment and villa communities with lower density than Gachibowli or Kokapet, and a still-developing local retail and school base as the population grows — expect ongoing construction activity in and around established projects for the next several years.</p>
<h2>Who tends to buy or rent here</h2>
<p>Buyers prioritising larger homes or plots at a lower price point than the core IT corridor, including a number of investors betting on the same appreciation trend already seen in neighbouring Tellapur and Nallagandla.</p>
<h2>Notable projects and developments</h2>
<p>Zuari Infraworld and Gangothri Developers have jointly signed a large premium residential project in Kollur, reported in the business press at around ₹1,500 crore. Other builder names (including Prestige) appear on Kollur project listings via real-estate portals, but we could not independently verify those beyond the portal listing itself, so treat them as developer-marketed rather than confirmed.</p>
${INFRA_NOTE}
`,
    displayOrder: 13,
  },
  {
    slug: "rajendra-nagar",
    name: "Rajendra Nagar",
    title: "Rajendra Nagar, Hyderabad — Complete Area Guide",
    excerpt:
      "A large, long-established mandal near Mehdipatnam and the airport road, now drawing new premium residential development.",
    metroConnectivity:
      "We found no confirmed metro station or funded Metro Phase 2 line reaching Rajendra Nagar directly. General Phase 2 coverage of an eventual airport-corridor line exists, but it doesn't clearly route through Rajendra Nagar itself — don't rely on a metro link here without firmer confirmation.",
    orrAccess:
      "Rajendra Nagar has its own dedicated Outer Ring Road interchange, Exit 17, and also sits on the HMDA-built PVNR Expressway toward Rajiv Gandhi International Airport at Shamshabad.",
    upcomingInfra:
      "Growth here is being driven by airport-road and ORR proximity rather than any single named infrastructure project — it's a long-established mandal (home to the Telangana Agricultural University and Nehru Zoological Park) rather than a newly carved-out IT-corridor layout.",
    contentHtml: `
<p>Rajendra Nagar is an older, larger mandal in southwest Hyderabad, historically more connected to the city's traditional institutions (the Telangana Agricultural University and Nehru Zoological Park both sit here) than to the IT corridor — but its direct ORR and airport-road access has made it a target for newer premium residential development in the last few years.</p>
<h2>What it's like to live here</h2>
<p>A broader mix than the purely IT-driven western suburbs: established neighbourhoods alongside newer gated developments, with easier access to the airport and the older parts of the city than Gachibowli-side localities offer.</p>
<h2>Who tends to buy or rent here</h2>
<p>A mix of long-time residents, buyers who specifically want airport proximity, and — more recently — buyers drawn in by new premium-branded projects marketing the area's ORR/airport-road access.</p>
<h2>Notable projects and developments</h2>
<p>Godrej Properties' Godrej Regal Pavilion is the headline named project marketed under the Rajendra Nagar address (it's also cross-listed under neighbouring Gaganpahad/Budvel by some portals, since the project sits near that boundary); Godrej has reported roughly ₹1,000 crore in sales from the project in business press coverage.</p>
${INFRA_NOTE}
`,
    displayOrder: 14,
  },
  {
    slug: "mansanpalle",
    name: "Mansanpalle",
    title: "Mansanpalle, Hyderabad — Complete Area Guide",
    excerpt:
      "A village in the Maheshwaram/Shamshabad corridor south of the city — part of the broader airport-driven growth story rather than the west-side IT corridor.",
    metroConnectivity:
      "No metro station or confirmed/proposed Metro Phase 2 line serves this area.",
    orrAccess:
      "Mansanpalle (also commonly spelled “Mansanpally” on real-estate portals) sits in Maheshwaram mandal, in the southern Shamshabad corridor near Rajiv Gandhi International Airport — not the western Gachibowli/Tellapur belt it's sometimes assumed to be near. We could not confirm a specific dedicated Outer Ring Road exit for this locality; budget for a drive to the nearest southern ORR interchange.",
    upcomingInfra:
      "We found no named, HMDA-notified, or independently reported infrastructure project specific to Mansanpalle itself. The broader Shamshabad corridor it sits within has a well-covered general growth story tied to airport expansion, but that's a wider-area trend, not a confirmed local project.",
    contentHtml: `
<p>Mansanpalle is a village in Maheshwaram mandal, part of the southern Shamshabad corridor that has grown alongside Rajiv Gandhi International Airport rather than the western IT corridor — worth keeping distinct from similarly-named west-side localities when comparing commute times.</p>
<h2>What it's like to live here</h2>
<p>Still largely at an early, plotted-development stage rather than a built-up suburb — expect fewer established amenities and a longer commute to the IT corridor than the Gachibowli-side localities in this guide series.</p>
<h2>Who tends to buy or rent here</h2>
<p>Primarily buyers targeting the lower entry price and the broader Shamshabad/airport-corridor growth story, often as a longer-term land or plot investment rather than an immediate IT-corridor commute.</p>
<h2>Notable projects and developments</h2>
<p>We could not find a named developer project or government notification specific to Mansanpalle itself beyond resale plot listings on real-estate portals. If you're evaluating a specific project here, verify its RERA registration and approvals directly rather than relying on general "Shamshabad is growing" marketing claims.</p>
${INFRA_NOTE}
`,
    displayOrder: 15,
  },
  {
    slug: "puppalaguda",
    name: "Puppalaguda",
    title: "Puppalaguda, Hyderabad — Complete Area Guide",
    excerpt:
      "A residential pocket between Narsingi and Manikonda, just off the Outer Ring Road, home to one of Aparna Constructions' largest recent launches.",
    metroConnectivity:
      "No metro station serves Puppalaguda, and we found no confirmed or proposed Metro Phase 2 line through it.",
    orrAccess:
      "Puppalaguda is reached via the Narsingi interchange on the Outer Ring Road (reported by some sources as Exit 18A — treat the exact exit number as unconfirmed until checked against an official HMDA/NHAI map), just south of the Gachibowli/Nanakramguda cluster.",
    upcomingInfra:
      "Road works connecting Narsingi and Puppalaguda have been reported as part of a wider city-wide link-road program run by the Hyderabad Road Development Corporation Limited (HRDCL) — we could confirm the program exists and names this stretch, but not its exact completion date or current status.",
    contentHtml: `
<p>Puppalaguda sits in the Rajendra Nagar/Narsingi belt of southwest Hyderabad, just off the Outer Ring Road between Narsingi and Manikonda/Nanakramguda — close enough to the Financial District for a reasonable commute while generally pricing lower than Kokapet or Gachibowli itself.</p>
<h2>What it's like to live here</h2>
<p>A growing mix of mid-to-large gated apartment communities, with construction activity still ongoing on some of the larger recent launches — expect the area's amenity base (schools, retail) to keep catching up with its residential growth over the next few years.</p>
<h2>Who tends to buy or rent here</h2>
<p>IT and finance professionals working in the Financial District/Gachibowli cluster who want a shorter commute than Tellapur or Kollur offer without paying Kokapet-level prices.</p>
<h2>Notable projects and developments</h2>
<p>Aparna Constructions announced a roughly ₹2,550 crore residential project here, Aparna Zenon — one of the larger single-developer investments reported for this specific locality, confirmed across multiple news outlets and the developer's own announcement.</p>
${INFRA_NOTE}
`,
    displayOrder: 16,
  },
  {
    slug: "narsingi",
    name: "Narsingi",
    title: "Narsingi, Hyderabad — Complete Area Guide",
    excerpt:
      "A southwestern Outer Ring Road locality next to Puppalaguda and Gandipet, with a completed dedicated ORR interchange.",
    metroConnectivity:
      "No metro station serves Narsingi, and no confirmed or proposed Metro Phase 2 line reaches it.",
    orrAccess:
      "Narsingi has a completed, inaugurated Outer Ring Road interchange serving the Gandipet/Narsingi stretch (reported by some sources as Exit 18A — treat the exact exit number as unconfirmed pending an official map check), giving it direct ring-road access without routing through Gachibowli.",
    upcomingInfra:
      "Beyond the completed ORR interchange, a link-road project connecting Narsingi and neighbouring Puppalaguda has been reported as part of a wider citywide road-development program run by HRDCL (Hyderabad Road Development Corporation Limited) — reported as in progress, though we could not independently confirm its current completion status.",
    contentHtml: `
<p>Narsingi sits on the southwestern edge of the Outer Ring Road, adjoining Puppalaguda and near Gandipet and Nanakramguda — a locality that's grown steadily as gated apartment and villa communities have filled in around its ORR access point.</p>
<h2>What it's like to live here</h2>
<p>A quieter, more residential feel than the Financial District or Gachibowli proper, with Gandipet's lake and green cover nearby giving it a somewhat different character from the denser IT-corridor core, while still offering a workable commute via the ORR.</p>
<h2>Who tends to buy or rent here</h2>
<p>Buyers who want ORR-adjacent connectivity and a quieter setting over being at the absolute centre of the job cluster — a similar buyer profile to Puppalaguda, its immediate neighbour.</p>
<h2>Notable projects and developments</h2>
<p>The main confirmed infrastructure item specific to Narsingi is its own ORR interchange, inaugurated in recent years, plus the ongoing Narsingi–Puppalaguda link-road work mentioned above. We did not find a large single named residential project headquartered in Narsingi itself (as distinct from neighbouring Puppalaguda's Aparna Zenon) in this research pass.</p>
${INFRA_NOTE}
`,
    displayOrder: 17,
  },
  {
    slug: "velimela",
    name: "Velimela",
    title: "Velimela, Hyderabad — Complete Area Guide",
    excerpt:
      "A village near Patancheru, northwest of the main NH65 corridor — one of the more thinly documented localities in this series.",
    metroConnectivity:
      "No metro station or proposed Metro Phase 2 line reaches Velimela.",
    orrAccess:
      "Velimela (also spelled “Velimala”) is reached via NH65 through Patancheru rather than a dedicated nearby Outer Ring Road exit — budget meaningfully more drive time to the ORR than from Tellapur or Gachibowli.",
    upcomingInfra:
      "We did not find any named, HMDA-notified, or independently news-reported infrastructure or development project specific to Velimela in this research pass.",
    contentHtml: `
<p>Velimela is a village in Ramachandrapuram mandal near Patancheru, on the northwest side of the Patancheru junction — a different stretch from the Tellapur/Nallagandla/Kollur belt, and noticeably further from the core IT corridor.</p>
<h2>What it's like to live here</h2>
<p>Largely a village/plotted-development setting today rather than an established suburb — information on this locality is genuinely thinner than for the other guides in this series, which itself tells you it's earlier in its development cycle.</p>
<h2>Who tends to buy or rent here</h2>
<p>Mostly buyers looking at land or plots at a lower entry price than the established corridor, generally as a longer-horizon bet rather than for an immediate commute-friendly home.</p>
<h2>Notable projects and developments</h2>
<p>We could not confirm any named developer project or government notification for Velimela beyond individual listings on real-estate portals, which we have not independently verified. If you're considering a specific project here, check its RERA registration directly rather than relying on portal listings alone.</p>
${INFRA_NOTE}
`,
    displayOrder: 18,
  },
  {
    slug: "mokila",
    name: "Mokila",
    title: "Mokila, Hyderabad — Complete Area Guide",
    excerpt:
      "A Shankarpalle-mandal locality west of Tellapur, best known for HMDA's actively running Mokila plot-layout e-auctions.",
    metroConnectivity:
      "No metro station or proposed Metro Phase 2 line reaches Mokila, and none is likely in the near term given its distance from the core corridor.",
    orrAccess:
      "Mokila is reached via NH65 and Shankarpalli Road rather than a direct Outer Ring Road exit, and sits further from the ORR than Tellapur or Gachibowli.",
    upcomingInfra:
      "HMDA has been running a phased e-auction of a residential plot layout in Mokila (reported through at least a Phase II round) — a government-run plotted-development program, not a single branded township.",
    contentHtml: `
<p>Mokila sits in Shankarpalle mandal, further west along the Shankarpalli road than Tellapur and Patancheru — still largely at the plotted-development stage, with HMDA's own Mokila layout auctions being the most significant activity reported in the area.</p>
<h2>What it's like to live here</h2>
<p>A village/emerging-layout setting rather than a built suburb today — expect limited existing amenities, with new gated villa and plot projects arriving as the area develops over the coming years.</p>
<h2>Who tends to buy or rent here</h2>
<p>Primarily buyers and investors purchasing HMDA-auctioned or developer-marketed plots for the long term, rather than people looking for an immediately move-in-ready home with a short IT-corridor commute.</p>
<h2>Notable projects and developments</h2>
<p>HMDA's Mokila layout e-auction is the clearest confirmed activity here — one reported round sold all 100 available plots for roughly ₹231.65 crore, with per-plot prices in some rounds reportedly touching close to ₹1 lakh per square yard. Separately, a number of private villa and plot projects (including names such as Abhirupa Alora Villas, NDR Vipasa, and Praneeta Amity Villas) are advertised in the area on real-estate portals; we have not independently verified these beyond the portal listings themselves.</p>
${INFRA_NOTE}
`,
    displayOrder: 19,
  },
  {
    slug: "gaganpahad",
    name: "Gaganpahad",
    title: "Gaganpahad, Hyderabad — Complete Area Guide",
    excerpt:
      "A historically semi-rural village in Rajendranagar mandal, near the PVNR Expressway, now being marketed by developers as an emerging premium address.",
    metroConnectivity:
      "No metro station or proposed Metro Phase 2 line serves Gaganpahad.",
    orrAccess:
      "Gaganpahad sits near the PVNR Expressway and the general Rajendranagar/airport-road corridor; we could not confirm a Gaganpahad-specific Outer Ring Road exit, so treat it as near — rather than directly on — the ring road.",
    upcomingInfra:
      "Developer marketing describes Gaganpahad as an emerging premium residential destination on the back of PVNR Expressway and ORR proximity — that framing comes from developer-published content, so treat it as a sales narrative rather than independently confirmed fact, even though the underlying road infrastructure itself is real.",
    contentHtml: `
<p>Gaganpahad is a historically semi-rural village in Rajendranagar mandal, south Hyderabad, close to the PVNR Expressway toward Rajiv Gandhi International Airport — an area that's drawn fresh developer interest in the last couple of years despite its still-modest existing built-up footprint.</p>
<h2>What it's like to live here</h2>
<p>A transitional setting — long-standing village character alongside newly launched premium residential projects — so expect the area's broader amenity base to lag behind what any single new project itself offers for now.</p>
<h2>Who tends to buy or rent here</h2>
<p>Buyers drawn by airport-road proximity and newer premium product at a lower entry price than the established west-side IT corridor, including investors betting on the area's longer-term growth story.</p>
<h2>Notable projects and developments</h2>
<p>Casagrand launched a residential project here, Casagrand Vybe, confirmed via industry news coverage. Godrej Properties' Godrej Regal Pavilion is also marketed under this general area by some sources (it straddles the Gaganpahad/Rajendra Nagar/Budvel boundary depending on the listing), with Godrej reporting roughly ₹1,000 crore in sales from that project.</p>
${INFRA_NOTE}
`,
    displayOrder: 20,
  },
  {
    slug: "nanakramguda",
    name: "Nanakramguda",
    title: "Nanakramguda, Hyderabad — Complete Area Guide",
    excerpt:
      "The dense corporate-campus core of the Financial District — covered as its own guide here since it's searched for separately, though it's the same locality.",
    metroConnectivity:
      "Shares the same unapproved Metro Phase 2 Blue Line spur proposal described in our Financial District guide (Raidurg → Biodiversity Junction → Nanakramguda → American Consulate) — no construction start date has been set as of early 2026.",
    orrAccess:
      "Nanakramguda has the same dedicated Outer Ring Road interchange as the wider Financial District area — Exit 19.",
    upcomingInfra:
      "The same Blue Line metro spur proposal is the headline item to track; it remains unapproved and unfunded as of early 2026.",
    contentHtml: `
<p>A quick note on overlap: Nanakramguda is the commercial heart of the locality we cover more broadly in our Financial District guide — the two names describe largely the same place. We've given it its own page because people search for it separately, and because it's worth calling out specifically as the densest cluster of corporate campuses (including Deloitte, Wells Fargo, and Franklin Templeton) within the wider Financial District.</p>
<h2>What it's like to live here</h2>
<p>Dominated by large office campuses during the day, with premium high-rise residential towers filling in around them aimed at the professionals working in those campuses — see our Financial District guide for the fuller neighbourhood picture.</p>
<h2>Who tends to buy or rent here</h2>
<p>Senior professionals at the surrounding campuses and NRI investors targeting the shortest possible commute to this specific cluster.</p>
<h2>Notable projects and developments</h2>
<p>Named residential towers reported in or marketed under the Nanakramguda address include Brigade Nanakramguda (Brigade Group), Cinq (a newly announced Raghava Group project), and Terminus 9, part of the FIDI development listed on real-estate portals.</p>
${INFRA_NOTE}
`,
    displayOrder: 21,
  },
  {
    slug: "gopanpally",
    name: "Gopanpally",
    title: "Gopanpally, Hyderabad — Complete Area Guide",
    excerpt:
      "Part of the Tellapur/Nallagandla west-corridor cluster, and the site of a state government-announced 439-acre IT park proposal.",
    metroConnectivity:
      "No metro station serves Gopanpally, and no confirmed or proposed Metro Phase 2 line reaches it.",
    orrAccess:
      "Gopanpally's Outer Ring Road access mirrors the Tellapur/Nallagandla side of the ring road; we could not confirm a dedicated exit specific to Gopanpally itself.",
    upcomingInfra:
      "The Telangana state IT minister announced that roughly 439 acres of land in Gopanpally had been identified for a new IT park, reported by multiple news outlets — but as of this research, it remains at the land-identification/announcement stage, not approved or under construction.",
    contentHtml: `
<p>Gopanpally sits within the same broad West Hyderabad IT-periphery cluster as Tellapur and Nallagandla, and has recently drawn attention as the site proposed for a large new state-backed IT park.</p>
<h2>What it's like to live here</h2>
<p>Similar in character to its Tellapur/Nallagandla neighbours — a mix of gated apartment communities serving overflow demand from the core IT corridor, with the area's identity likely to shift further if the proposed IT park moves forward.</p>
<h2>Who tends to buy or rent here</h2>
<p>IT-corridor professionals seeking a similar trade-off to Tellapur/Nallagandla (more space, somewhat longer commute), plus investors specifically watching the proposed IT park for its potential effect on future demand.</p>
<h2>Notable projects and developments</h2>
<p>The Telangana government announced that approximately 439.15 acres in Gopanpally had been identified for a new IT park, as part of a broader announcement of new IT parks in Hyderabad's suburbs, reported independently by multiple outlets. This is an announced/land-identified proposal, not an approved or funded project — there's no confirmed construction timeline as of this writing.</p>
${INFRA_NOTE}
`,
    displayOrder: 22,
  },
  {
    slug: "nallagandla",
    name: "Nallagandla",
    title: "Nallagandla, Hyderabad — Complete Area Guide",
    excerpt:
      "An established, fast-growing West Hyderabad locality along NH65 with a long-running, heavy presence from Aparna Constructions.",
    metroConnectivity:
      "No metro station serves Nallagandla, and no confirmed or proposed Metro Phase 2 line reaches it.",
    orrAccess:
      "Nallagandla's Outer Ring Road access mirrors Tellapur's — reached via NH65 on the Patancheru side of the ring road, rather than through a dedicated exit of its own.",
    upcomingInfra:
      "Nallagandla is commonly discussed together with Tellapur and Kollur as a single fast-appreciating growth belt along NH65 — driven by overflow demand from the IT corridor's core rather than any one named infrastructure project.",
    contentHtml: `
<p>Nallagandla is one of the more established localities in this west-side growth belt, with housing prices reported rising alongside neighbouring Tellapur and Kollur as IT-corridor demand continues to spill outward.</p>
<h2>What it's like to live here</h2>
<p>A mature mix of gated apartment communities (several now fully built out and occupied, with others still under construction), with a more developed local retail and school base than newer localities further out like Kollur or Mokila.</p>
<h2>Who tends to buy or rent here</h2>
<p>IT professionals and families who want an established neighbourhood with a reasonable NH65 commute, plus investors drawn by the area's track record of price appreciation.</p>
<h2>Notable projects and developments</h2>
<p>Aparna Constructions has a particularly large, long-running footprint here, with multiple named projects including Aparna Sarovar, Aparna Cyber County, Aparna Cyber Commune, and Aparna Cyberscape — a mix of completed and under-construction phases per the developer's own materials and real-estate portal listings; treat specific completion status as developer-reported rather than independently audited.</p>
${INFRA_NOTE}
`,
    displayOrder: 23,
  },
];

async function main() {
  const inserted: string[] = [];
  const skipped: string[] = [];

  for (const guide of GUIDES) {
    const existing = await db
      .select({ id: localityGuides.id })
      .from(localityGuides)
      .where(sql`${localityGuides.slug} = ${guide.slug}`)
      .limit(1);

    if (existing.length > 0) {
      skipped.push(guide.slug);
      continue;
    }

    await db.insert(localityGuides).values({
      ...guide,
      status: "published" as const,
      publishedAt: sql`(current_timestamp)`,
    });
    inserted.push(guide.slug);
  }

  console.log(`Inserted ${inserted.length} locality guide(s): ${inserted.join(", ") || "(none)"}.`);
  if (skipped.length > 0) {
    console.log(`Skipped ${skipped.length} already-existing slug(s): ${skipped.join(", ")}.`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
