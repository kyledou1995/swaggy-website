import Link from 'next/link';

const SIZES = {
  md: 'text-2xl',
  lg: 'text-3xl',
} as const;

interface LogoProps {
  size?: keyof typeof SIZES;
  /** Use on dark backgrounds (admin portal). */
  dark?: boolean;
  href?: string | null;
  className?: string;
}

/** The Merchin wordmark: "merchin" with a green period. Use everywhere for consistency. */
export function Logo({ size = 'md', dark = false, href = '/', className = '' }: LogoProps) {
  const content = (
    <span
      className={`${SIZES[size]} font-bold tracking-tight leading-none ${dark ? 'text-white' : 'text-gray-900'} ${className}`}
    >
      merchin<span className="text-emerald-500">.</span>
    </span>
  );
  return href ? (
    <Link href={href} aria-label="Merchin home" className="inline-flex">
      {content}
    </Link>
  ) : (
    content
  );
}
