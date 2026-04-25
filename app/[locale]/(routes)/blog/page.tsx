import type { Metadata } from 'next';
import Link from 'next/link';

import { AuthAwareBlogAction } from '@/components/blog/AuthAwareBlogAction';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import { PublicBlogHeader } from '@/components/blog/PublicBlogHeader';
import {
  formatBlogDate,
  getAllBlogPosts,
  getBlogUiCopy,
} from '@/lib/content/blog';
import type { Locale } from '@/src/lib/i18n';

type Props = {
  params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const ui = getBlogUiCopy(locale);

  return {
    title: ui.blogMetaTitle,
    description: ui.blogMetaDescription,
    alternates: {
      canonical: `/${locale}/blog`,
    },
    openGraph: {
      title: ui.blogMetaTitle,
      description: ui.blogMetaDescription,
      url: `/${locale}/blog`,
      type: 'website',
    },
  };
}

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;
  const ui = getBlogUiCopy(locale);
  const posts = getAllBlogPosts(locale);
  const [featuredPost, ...otherPosts] = posts;

  return (
    <div className="min-h-screen bg-[#f9ffc6]/80">
      <PublicBlogHeader currentPath="/blog" locale={locale} />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-[calc(4rem+env(safe-area-inset-top))] md:px-8 md:pt-24">
        <section className="grid gap-8 rounded-[36px] border border-black/10 bg-white/60 px-6 py-8 shadow-[0_18px_60px_rgba(0,0,0,0.08)] backdrop-blur-sm md:grid-cols-[minmax(0,1fr)_280px] md:px-8 md:py-10">
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
              {ui.blog}
            </p>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-black leading-[0.96] tracking-[-0.06em] text-black md:text-6xl">
                {ui.listTitle}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-black/62 md:text-lg">
                {ui.intro}
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-[28px] border border-black/10 bg-[#fff7ea] p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
                {featuredPost.category}
              </p>
              <p className="mt-3 text-sm leading-6 text-black/62">
                {ui.listDescription}
              </p>
            </div>

            <div className="mt-6 space-y-2 text-sm text-black/58">
              <p>{formatBlogDate(locale, featuredPost.publishedAt)}</p>
              <p>{ui.readTime(featuredPost.readingMinutes)}</p>
              <p>{featuredPost.tags.slice(0, 2).join(' · ')}</p>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <BlogPostCard featured locale={locale} post={featuredPost} />
        </section>

        <section className="mt-10">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-black tracking-[-0.04em] text-black">
              {ui.moreArticles}
            </h2>
            <AuthAwareBlogAction
              signedOutHref={`/${locale}/sign-up`}
              signedOutLabel={ui.startFree}
              signedInHref={`/${locale}/myweek`}
              signedInLabel={ui.openApp}
              className="hidden rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm font-semibold text-black/70 transition hover:text-black md:inline-flex"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {otherPosts.map((post) => (
              <BlogPostCard key={post.id} locale={locale} post={post} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
