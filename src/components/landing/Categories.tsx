import {
  Shirt,
  GlassWater,
  ShoppingBag,
  Package,
  Cable,
  Sparkles,
  Lamp,
  PawPrint,
  Tag,
  ToyBrick,
  Dumbbell,
  NotebookPen,
  CookingPot,
  Gift,
  Footprints,
  Crown,
} from 'lucide-react';

const ROW_1 = [
  { icon: Shirt, label: 'Apparel' },
  { icon: Crown, label: 'Headwear' },
  { icon: GlassWater, label: 'Drinkware' },
  { icon: ShoppingBag, label: 'Bags & totes' },
  { icon: Package, label: 'Custom packaging' },
  { icon: Cable, label: 'Tech accessories' },
  { icon: Sparkles, label: 'Beauty & skincare' },
  { icon: Lamp, label: 'Home goods' },
];
const ROW_2 = [
  { icon: PawPrint, label: 'Pet products' },
  { icon: Tag, label: 'Labels & tags' },
  { icon: ToyBrick, label: 'Toys & plush' },
  { icon: Dumbbell, label: 'Fitness gear' },
  { icon: NotebookPen, label: 'Stationery' },
  { icon: CookingPot, label: 'Kitchenware' },
  { icon: Footprints, label: 'Socks & footwear' },
  { icon: Gift, label: 'Gift sets' },
];

function Row({ items, reverse }: { items: typeof ROW_1; reverse?: boolean }) {
  const doubled = [...items, ...items];
  return (
    <div className={`flex gap-3.5 w-max ${reverse ? 'animate-merchin-marquee-rev' : 'animate-merchin-marquee'}`}>
      {doubled.map(({ icon: Icon, label }, i) => (
        <div
          key={`${label}-${i}`}
          aria-hidden={i >= items.length}
          className="flex items-center gap-2.5 px-5 py-3.5 bg-white border border-gray-200 rounded-2xl font-semibold text-gray-900 whitespace-nowrap"
        >
          <span className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Icon size={17} className="text-emerald-600" />
          </span>
          {label}
        </div>
      ))}
    </div>
  );
}

export default function Categories() {
  return (
    <section className="py-20 bg-gray-50 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-10">
        <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 mb-4">If you can sell it, we can source it</h2>
        <p className="text-lg text-gray-600">From apparel to packaging, one partner for every product you sell.</p>
      </div>
      <div className="merchin-marquee merchin-fade-edges space-y-3.5">
        <Row items={ROW_1} />
        <Row items={ROW_2} reverse />
      </div>
    </section>
  );
}
