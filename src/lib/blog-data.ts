export type BlogSection =
  | { type: "h2"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "quote"; text: string };

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  role: string;
  date: string; // ISO
  readMinutes: number;
  gradient: string; // tailwind gradient classes for the cover
  tags: string[];
  content: BlogSection[];
};

export const POSTS: BlogPost[] = [
  {
    slug: "why-indian-travel-agencies-need-a-crm-in-2026",
    title: "Why every Indian travel agency needs a CRM in 2026",
    excerpt:
      "Spreadsheets, WhatsApp threads and email inboxes were fine for 2015. Here is why they are quietly costing you 30% of your revenue today.",
    category: "Growth",
    author: "Aarav Mehta",
    role: "Founder, TraWe",
    date: "2026-01-12",
    readMinutes: 6,
    gradient: "from-teal-500/30 via-emerald-500/20 to-cyan-500/30",
    tags: ["CRM", "Travel", "India"],
    content: [
      { type: "p", text: "Indian outbound travel has never been hotter. Passport issuance crossed 15 million a year, tier-2 cities are booking Europe like it is Goa, and every family group chat has a couple whispering \"honeymoon budget\". The demand is here. The question is whether your agency is set up to catch it." },
      { type: "h2", text: "The hidden cost of running on WhatsApp" },
      { type: "p", text: "The average agency owner we talk to has 400+ unread WhatsApp threads and no idea which of them is worth ₹2 lakh and which is a tyre-kicker. Leads leak, follow-ups slip, and quotations sit in Downloads folders." },
      { type: "ul", items: [
        "No single view of the pipeline — you cannot forecast next month.",
        "No ownership — two agents sometimes reply to the same lead with different prices.",
        "No history — when a customer returns after 18 months, you start from zero.",
        "No compliance — GST invoices are recreated by hand every time."
      ]},
      { type: "h2", text: "What a modern CRM changes" },
      { type: "p", text: "A CRM built for travel does not just store contacts. It turns an enquiry into an itinerary, an itinerary into a GST-compliant quotation, a quotation into a Razorpay payment link, and a payment into a booking voucher — all in the same thread." },
      { type: "quote", text: "We closed 22% more bookings in our first quarter on TraWe. Not because we worked harder — because nothing slipped." },
      { type: "h2", text: "Where to start" },
      { type: "p", text: "Do not boil the ocean. Pick one leaky bucket this month — usually it is follow-ups — and fix it end to end. Then move to quotations. Then payments. In 90 days you will not recognise your operation." },
    ],
  },
  {
    slug: "gst-invoicing-for-travel-agents-explained",
    title: "GST invoicing for travel agents, finally explained",
    excerpt: "5% vs 18%, TCS on foreign remittance, SAC codes and the invoice fields the department actually looks for.",
    category: "Compliance",
    author: "Priya Nair",
    role: "Head of Product, TraWe",
    date: "2026-01-18",
    readMinutes: 8,
    gradient: "from-orange-500/30 via-amber-500/20 to-rose-500/30",
    tags: ["GST", "Invoicing", "Compliance"],
    content: [
      { type: "p", text: "GST on travel is not complicated once you separate the three things the government cares about: what you are selling, how you are selling it, and where the customer is going." },
      { type: "h2", text: "The two rates you will use most" },
      { type: "ul", items: [
        "5% (without ITC) — when you sell a tour package as a principal.",
        "18% (with ITC) — when you act as an agent and charge a service fee or commission.",
      ]},
      { type: "h2", text: "SAC codes that matter" },
      { type: "ul", items: [
        "998551 — Reservation services for travel.",
        "998552 — Reservation services for accommodation, cruises and packages.",
        "998555 — Tour operator services.",
      ]},
      { type: "h2", text: "TCS on foreign remittance (LRS)" },
      { type: "p", text: "For outbound packages above ₹7 lakh per PAN per financial year, you must collect 20% TCS. Below that threshold — 5%. TraWe flags the threshold automatically and adds the line to the invoice." },
      { type: "h2", text: "The fields auditors actually check" },
      { type: "ul", items: [
        "GSTIN of supplier and (if B2B) recipient",
        "Place of supply — state code",
        "HSN/SAC on every line",
        "Reverse charge flag",
        "Signature or digital signature",
      ]},
    ],
  },
  {
    slug: "converting-whatsapp-enquiries-into-bookings",
    title: "Converting WhatsApp enquiries into bookings, at scale",
    excerpt: "A repeatable 7-step playbook that takes an enquiry from \"hi price kya hai\" to a confirmed payment link in under 24 hours.",
    category: "Sales",
    author: "Rohan Kapoor",
    role: "Sales Lead, TraWe",
    date: "2026-01-25",
    readMinutes: 5,
    gradient: "from-sky-500/30 via-teal-500/20 to-emerald-500/30",
    tags: ["WhatsApp", "Sales", "Playbook"],
    content: [
      { type: "p", text: "WhatsApp is where Indian travel is sold. But most agencies treat it as a chat app, not a sales channel. Here is the seven-step loop our best operators run every day." },
      { type: "ul", items: [
        "1. Auto-log every new number as a lead with source = WhatsApp.",
        "2. Ask three qualifying questions in the first reply — dates, pax, budget.",
        "3. Send a shortlist of 2 itineraries within 2 hours, not 2 days.",
        "4. Attach a branded PDF quotation with a valid-till date.",
        "5. Follow up on day 1, day 3, day 7 with different angles.",
        "6. Collect 25% via a Razorpay link inside the same thread.",
        "7. Send the voucher PDF automatically the moment payment clears.",
      ]},
      { type: "quote", text: "Speed of first meaningful reply is the single biggest predictor of a closed booking. Beat two hours and you win most of your quotes." },
    ],
  },
  {
    slug: "building-itineraries-that-sell-themselves",
    title: "Building itineraries that sell themselves",
    excerpt: "The design, structure and pricing tricks that make a customer pick your quotation over three others in their inbox.",
    category: "Product",
    author: "Priya Nair",
    role: "Head of Product, TraWe",
    date: "2026-02-02",
    readMinutes: 7,
    gradient: "from-purple-500/30 via-fuchsia-500/20 to-pink-500/30",
    tags: ["Itineraries", "Design", "Pricing"],
    content: [
      { type: "p", text: "Customers are not comparing your itinerary to reality. They are comparing it to two other PDFs they got yesterday. Small structural choices decide who wins." },
      { type: "h2", text: "Lead with the hero image, not the header" },
      { type: "p", text: "The first page should feel like a magazine spread — a full-bleed image, the destination name, and the trip dates. Save your logo for the footer." },
      { type: "h2", text: "Day-by-day, not hour-by-hour" },
      { type: "p", text: "Over-specifying every 30 minutes makes the plan feel rigid and exposes you to change requests. Group by morning / afternoon / evening and let the guide sequence it locally." },
      { type: "h2", text: "Price anchoring done right" },
      { type: "ul", items: [
        "Show three tiers — Comfort, Premium, Luxe — with the middle one recommended.",
        "Break the price per person, not total, and mention EMI upfront.",
        "Always add a value box: \"What is included\" bigger than \"What is not\".",
      ]},
    ],
  },
  {
    slug: "using-ai-to-draft-tour-packages-in-seconds",
    title: "Using AI to draft tour packages in seconds",
    excerpt: "How our AI copilot turns \"7 nights in Vietnam, family of 4, mid budget\" into a fully branded, editable itinerary — and where humans still add magic.",
    category: "AI",
    author: "Aarav Mehta",
    role: "Founder, TraWe",
    date: "2026-02-10",
    readMinutes: 6,
    gradient: "from-indigo-500/30 via-violet-500/20 to-purple-500/30",
    tags: ["AI", "Copilot", "Automation"],
    content: [
      { type: "p", text: "The best use of AI in a travel agency is not writing cute captions. It is compressing the boring 40 minutes between an enquiry and a first draft down to 40 seconds." },
      { type: "h2", text: "What the AI does well" },
      { type: "ul", items: [
        "Sequencing cities and nights sensibly by geography.",
        "Suggesting hotels in the right star-rating band.",
        "Drafting day-wise activities with local flavour.",
        "Generating a matching customer-facing description.",
      ]},
      { type: "h2", text: "What a human still does better" },
      { type: "ul", items: [
        "Knowing that the client hated humidity last time.",
        "Swapping in your supplier who owes you a favour.",
        "Pricing the trip for the client's true budget, not the average.",
      ]},
      { type: "quote", text: "AI drafts. Humans decide. That is the split that scales without losing your voice." },
    ],
  },
  {
    slug: "hotel-contracting-101-for-small-agencies",
    title: "Hotel contracting 101 for small agencies",
    excerpt: "How to negotiate B2B rates directly with hotels, structure EP/CP/MAP/AP grids, and defend your margin across seasons.",
    category: "Operations",
    author: "Sneha Iyer",
    role: "Ops Advisor",
    date: "2026-02-18",
    readMinutes: 9,
    gradient: "from-emerald-500/30 via-teal-500/20 to-cyan-500/30",
    tags: ["Hotels", "B2B", "Margin"],
    content: [
      { type: "p", text: "Most small agencies pay 15-25% more than they should for hotels — not because they are bad negotiators, but because they never ask for a rate card." },
      { type: "h2", text: "The four meal plans, decoded" },
      { type: "ul", items: [
        "EP — Room only.",
        "CP — Room + breakfast.",
        "MAP — Room + breakfast + one meal.",
        "AP — Room + all three meals.",
      ]},
      { type: "h2", text: "What to ask for in the first email" },
      { type: "ul", items: [
        "Confidential B2B rate sheet valid for the season.",
        "Child policy and extra bed rates spelled out.",
        "Release period and cancellation slabs.",
        "GST treatment — whether rate is inclusive or plus.",
      ]},
      { type: "h2", text: "Storing rates the smart way" },
      { type: "p", text: "Do not paste the rate card into a spreadsheet you will lose. Store it against the hotel with season validity, so your quotation pulls the right price automatically." },
    ],
  },
  {
    slug: "customer-portal-the-underrated-loyalty-lever",
    title: "The customer portal is the most underrated loyalty lever in travel",
    excerpt: "Give travellers a single link that shows their itinerary, invoices, vouchers and travel documents — and watch repeat bookings climb.",
    category: "Growth",
    author: "Rohan Kapoor",
    role: "Sales Lead, TraWe",
    date: "2026-02-25",
    readMinutes: 5,
    gradient: "from-teal-500/30 via-sky-500/20 to-blue-500/30",
    tags: ["Portal", "Retention", "CX"],
    content: [
      { type: "p", text: "Everyone talks about acquisition. But repeat travellers cost you almost nothing and refer three friends on average. The cheapest way to earn that repeat is to look organised after they have paid." },
      { type: "h2", text: "What lives in the portal" },
      { type: "ul", items: [
        "The confirmed itinerary as a live page, not a stale PDF.",
        "GST invoices ready to download for reimbursement.",
        "Hotel and flight vouchers in one place.",
        "Passport and visa uploads for every traveller.",
        "A single WhatsApp button to reach their agent.",
      ]},
      { type: "quote", text: "The client stops asking \"can you resend the voucher?\" — and starts asking \"where should we go next year?\"." },
    ],
  },
  {
    slug: "automating-follow-ups-without-sounding-like-a-bot",
    title: "Automating follow-ups without sounding like a bot",
    excerpt: "A quiet, human tone beats aggressive drip campaigns every time. Here is how we design automations that customers actually reply to.",
    category: "Automation",
    author: "Priya Nair",
    role: "Head of Product, TraWe",
    date: "2026-03-04",
    readMinutes: 6,
    gradient: "from-rose-500/30 via-orange-500/20 to-amber-500/30",
    tags: ["Automation", "Follow-ups", "Copy"],
    content: [
      { type: "p", text: "Nothing kills a warm lead faster than a template that screams template. Two tweaks make automated follow-ups feel personal." },
      { type: "h2", text: "Tweak 1: Reference the enquiry, not the offer" },
      { type: "p", text: "\"Following up on your Bali plan for July\" beats \"Special summer offer 20% off\" every single time." },
      { type: "h2", text: "Tweak 2: Vary the ask" },
      { type: "ul", items: [
        "Day 1 — Share the quote and ask about dates flexibility.",
        "Day 3 — Share a photo or short video of one hotel.",
        "Day 7 — Ask if they want you to hold the rate for a week.",
      ]},
      { type: "quote", text: "If a human reading the message would cringe, do not send it. That is the whole rule." },
    ],
  },
  {
    slug: "reporting-that-actually-changes-decisions",
    title: "Reporting that actually changes decisions",
    excerpt: "Most agency dashboards are decoration. Here are the four numbers we track weekly that actually move the business.",
    category: "Analytics",
    author: "Aarav Mehta",
    role: "Founder, TraWe",
    date: "2026-03-11",
    readMinutes: 5,
    gradient: "from-cyan-500/30 via-teal-500/20 to-emerald-500/30",
    tags: ["Analytics", "KPIs", "Decisions"],
    content: [
      { type: "p", text: "A dashboard should force a decision by Monday morning. If yours does not, delete half of it." },
      { type: "h2", text: "The four numbers" },
      { type: "ul", items: [
        "Enquiry-to-quote time — median hours from first message to a sent PDF.",
        "Quote-to-book conversion — by source, so you know where to spend.",
        "Realised margin per booking — after supplier bills clear, not before.",
        "Refund and cancellation rate — the silent margin killer.",
      ]},
      { type: "h2", text: "One habit that compounds" },
      { type: "p", text: "Every Monday 9am, the founder pulls these four numbers and shares them in the team WhatsApp. That single ritual has moved more agencies from stagnant to growing than any tool we have shipped." },
    ],
  },
  {
    slug: "scaling-from-solo-agent-to-a-team-of-ten",
    title: "Scaling from solo agent to a team of ten, without losing the plot",
    excerpt: "The org design, tooling and rituals that let you grow from a one-person shop to a real agency — without every decision passing through you.",
    category: "Leadership",
    author: "Sneha Iyer",
    role: "Ops Advisor",
    date: "2026-03-18",
    readMinutes: 8,
    gradient: "from-violet-500/30 via-indigo-500/20 to-blue-500/30",
    tags: ["Team", "Leadership", "Scale"],
    content: [
      { type: "p", text: "The jump from three people to ten is harder than the jump from one to three. You go from doing every deal to designing how deals get done." },
      { type: "h2", text: "Split by function, not geography" },
      { type: "ul", items: [
        "Sales — first response, quoting, closing.",
        "Ops — bookings, vouchers, supplier bills.",
        "Care — during-trip and post-trip support.",
      ]},
      { type: "h2", text: "Codify five things in the first month" },
      { type: "ul", items: [
        "Lead assignment rules.",
        "Standard quotation template.",
        "Discount approval matrix.",
        "Refund policy in plain language.",
        "One weekly review meeting with a fixed agenda.",
      ]},
      { type: "quote", text: "You do not scale a business by working harder. You scale it by writing down what you already do well, so ten other people can do it too." },
    ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}