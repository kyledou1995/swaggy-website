export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string; // ISO date
  readMinutes: number;
  content: React.ReactNode;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'ddp-vs-fob-landed-cost',
    title: 'DDP vs. FOB: What Your Supplier Quote Is Really Telling You',
    excerpt:
      'Two quotes for the same product can differ by 40% once freight, duties, and fees land. Here is how to compare them properly.',
    category: 'Sourcing',
    date: '2026-10-20',
    readMinutes: 5,
    content: (
      <>
        <p>
          The cheapest quote in your inbox is rarely the cheapest product on your shelf. The
          difference comes down to the shipping term, or Incoterm, written next to the price. If
          you don't know which one you're looking at, you can't compare quotes fairly.
        </p>
        <h2>FOB: the price stops at the port</h2>
        <p>
          FOB (Free On Board) means the supplier covers production and getting the goods onto a
          ship at the origin port. Everything after that is yours: ocean or air freight, insurance,
          customs brokerage, import duties, port fees, and the final trucking leg to your warehouse.
        </p>
        <p>
          FOB quotes look attractive because they leave out a large share of the real cost. For
          many consumer products, freight and duties add 15 to 40 percent on top of the FOB price,
          and that range swings with tariffs and freight rates.
        </p>
        <h2>DDP: the price includes everything</h2>
        <p>
          DDP (Delivered Duty Paid) means the seller delivers the goods to your door with freight,
          customs clearance, and duties already paid. The per-unit price is your landed cost. There
          is no customs broker to hire and no surprise invoice when the container arrives.
        </p>
        <h2>How to compare quotes</h2>
        <ul>
          <li>Convert every quote to a landed cost per unit before comparing.</li>
          <li>Ask what freight method the quote assumes and how long transit takes.</li>
          <li>Check which duty rate applies to your product's HTS code; it can change the math entirely.</li>
          <li>Account for your own time. Coordinating forwarders and brokers is real work.</li>
        </ul>
        <p>
          Every Merchin quote is DDP and shows both air and ocean options side by side, so the
          number you approve is the number you pay.
        </p>
      </>
    ),
  },
  {
    slug: 'how-to-approve-a-production-sample',
    title: 'How to Approve a Production Sample Without Regrets',
    excerpt:
      'The sample is your last cheap chance to catch mistakes. A simple checklist for reviewing it before you commit to thousands of units.',
    category: 'Quality',
    date: '2026-10-13',
    readMinutes: 4,
    content: (
      <>
        <p>
          Approving a sample is effectively signing off on your entire production run. Whatever you
          accept now is the standard the factory will be held to. A few extra minutes of review
          here can save weeks of rework later.
        </p>
        <h2>Review against the spec, not your memory</h2>
        <p>
          Lay the sample next to your original order: materials, colors, dimensions, logo placement,
          and packaging. Check each item one by one. It's easy to approve something that looks
          good but isn't what you asked for.
        </p>
        <h2>A practical checklist</h2>
        <ul>
          <li><strong>Color:</strong> compare under daylight, not just office lighting. Screens lie.</li>
          <li><strong>Dimensions:</strong> measure. Small differences add up across sizes.</li>
          <li><strong>Branding:</strong> check logo size, position, sharpness, and thread or ink color.</li>
          <li><strong>Materials and feel:</strong> weight, stitching, finish, and durability.</li>
          <li><strong>Packaging:</strong> labels, inserts, barcodes, and how the product sits in the box.</li>
          <li><strong>Use it:</strong> wear it, wash it, fill it, drop it. Treat it like a customer would.</li>
        </ul>
        <h2>Be specific when asking for changes</h2>
        <p>
          "Make it darker" is hard to act on. "Match Pantone 19-4052 and move the logo 2 cm higher"
          is not. Include photos with annotations and measurements whenever you can.
        </p>
        <p>
          In Merchin, you can review sample photos, request physical samples, and request changes on
          the order itself, so every revision is documented before production begins.
        </p>
      </>
    ),
  },
  {
    slug: 'air-vs-ocean-freight',
    title: 'Air or Ocean Freight? How to Choose for Your Next Order',
    excerpt:
      'Speed costs money. A quick framework for deciding when air freight is worth it and when ocean is the smarter call.',
    category: 'Logistics',
    date: '2026-10-06',
    readMinutes: 4,
    content: (
      <>
        <p>
          Once production is done, how your goods travel can change both your margin and your launch
          date. Neither option is always right; it depends on what you're shipping and when you
          need it.
        </p>
        <h2>When air freight makes sense</h2>
        <ul>
          <li>You have a hard launch date or seasonal window you can't miss.</li>
          <li>The product is small, light, and high value, so freight is a small share of unit cost.</li>
          <li>You're testing a new product and want to sell through a small batch quickly.</li>
          <li>You're restocking a bestseller that's about to go out of stock.</li>
        </ul>
        <h2>When ocean freight makes sense</h2>
        <ul>
          <li>The order is large, heavy, or bulky.</li>
          <li>You've planned inventory far enough ahead to absorb a longer transit time.</li>
          <li>Margin matters more than speed for this run.</li>
        </ul>
        <h2>A simple rule of thumb</h2>
        <p>
          Compare the landed cost per unit for each option, then ask what a few extra weeks of
          inventory is worth to you. If missing the window costs more in lost sales than the price
          difference, fly it. Otherwise, put it on the water and plan ahead next time.
        </p>
        <p>
          Merchin quotes include both DDP air and DDP ocean pricing with production and transit
          times, so you can make the call with real numbers.
        </p>
      </>
    ),
  },
];

export function getPost(slug: string) {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function formatPostDate(iso: string) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
