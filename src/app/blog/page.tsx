import type { Metadata } from 'next';
import Link from 'next/link';
import PageShell from '@/components/landing/PageShell';
import { BLOG_POSTS, formatPostDate } from '@/lib/blog-posts';

export const metadata: Metadata = {
  title: 'Blog — Merchin',
  description: 'Practical guides on sourcing, quality control, and logistics for ecommerce brands.',
};

export default function BlogPage() {
  const posts = [...BLOG_POSTS].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <PageShell
      eyebrow="Blog"
      title="Sourcing, explained"
      subtitle="Practical guides on manufacturing, quality, and logistics for brands that sell physical products."
    >
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex flex-col p-6 rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all"
          >
            <span className="self-start text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full mb-4">
              {post.category}
            </span>
            <h2 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-emerald-700 transition-colors">
              {post.title}
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-6 flex-1">{post.excerpt}</p>
            <p className="text-xs text-gray-500">
              {formatPostDate(post.date)} · {post.readMinutes} min read
            </p>
          </Link>
        ))}
      </section>
    </PageShell>
  );
}
