import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import PageShell, { CTABanner, Prose } from '@/components/landing/PageShell';
import { BLOG_POSTS, formatPostDate, getPost } from '@/lib/blog-posts';

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: 'Post not found — Merchin' };
  return { title: `${post.title} — Merchin`, description: post.excerpt };
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <PageShell
      eyebrow={`${post.category} · ${formatPostDate(post.date)} · ${post.readMinutes} min read`}
      title={post.title}
      subtitle={post.excerpt}
    >
      <Prose>
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm mb-8">
          <ArrowLeft size={16} /> All posts
        </Link>
        {post.content}
      </Prose>
      <CTABanner title="Want us to handle this for you?" />
    </PageShell>
  );
}
