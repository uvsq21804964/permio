import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AuthAwareBlogAction } from '@/components/blog/AuthAwareBlogAction';
import { BlogImageFigure } from '@/components/blog/BlogImageFigure';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import { PublicBlogHeader } from '@/components/blog/PublicBlogHeader';
import {
  formatBlogDate,
  getBlogPostBySlug,
  getBlogStaticParams,
  getBlogUiCopy,
  getRelatedBlogPosts,
} from '@/lib/content/blog';
import type { Locale } from '@/src/lib/i18n';

type Props = {
  params: Promise<{ locale: Locale; slug: string }>;
};

function toSectionId(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateStaticParams() {
  return getBlogStaticParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getBlogPostBySlug(locale, slug);

  if (!post) {
    return {};
  }

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: `/${locale}/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      url: `/${locale}/blog/${post.slug}`,
      publishedTime: `${post.publishedAt}T12:00:00Z`,
      images: [
        {
          url: post.coverImage.src,
          alt: post.coverImage.alt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [post.coverImage.src],
    },
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const { locale, slug } = await params;
  const post = getBlogPostBySlug(locale, slug);

  if (!post) {
    notFound();
  }

  const ui = getBlogUiCopy(locale);
  const relatedPosts = getRelatedBlogPosts(locale, post.id, 2);

  return (
    <div className="min-h-screen bg-[#f9ffc6]/80">
      <PublicBlogHeader currentPath="/blog" locale={locale} />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-[calc(4rem+env(safe-area-inset-top))] md:px-8 md:pt-24">
        <div className="rounded-[36px] border border-black/10 bg-white/80 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.08)] md:p-8">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
            <span>{ui.articleLabel}</span>
            <span className="h-1 w-1 rounded-full bg-black/20" />
            <span>{post.category}</span>
          </div>

          <div className="mt-5 max-w-4xl space-y-5">
            <Link
              href={`/${locale}/blog`}
              className="inline-flex items-center text-sm font-medium text-black/55 transition hover:text-black"
            >
              {ui.backToBlog}
            </Link>

            <h1 className="text-4xl font-black leading-[0.96] tracking-[-0.06em] text-black md:text-6xl">
              {post.title}
            </h1>

            <p className="max-w-3xl text-base leading-7 text-black/62 md:text-lg">
              {post.description}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 text-sm text-black/52">
            <span>{formatBlogDate(locale, post.publishedAt)}</span>
            <span>•</span>
            <span>{ui.readTime(post.readingMinutes)}</span>
          </div>

          <div className="mt-8">
            <BlogImageFigure image={post.coverImage} priority />
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
          <article className="rounded-[32px] border border-black/10 bg-white/95 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.08)] md:p-8">
            <div className="space-y-10">
              {post.sections.map((section) => (
                <section key={section.heading} id={toSectionId(section.heading)}>
                  <h2 className="text-2xl font-black tracking-[-0.04em] text-black">
                    {section.heading}
                  </h2>

                  <div className="mt-4 space-y-4 text-base leading-7 text-black/70">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>

                  {section.image ? (
                    <div className="mt-6">
                      <BlogImageFigure image={section.image} />
                    </div>
                  ) : null}

                  {section.bullets?.length ? (
                    <ul className="mt-5 space-y-3 rounded-[24px] border border-black/10 bg-[#fffaf2] p-5 text-sm leading-6 text-black/68">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="flex gap-3">
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary/70" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>
          </article>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[28px] border border-black/10 bg-white/90 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
                {ui.summary}
              </p>

              <ul className="mt-4 space-y-3 text-sm text-black/65">
                {post.sections.map((section) => (
                  <li key={section.heading}>
                    <a
                      href={`#${toSectionId(section.heading)}`}
                      className="transition hover:text-black"
                    >
                      {section.heading}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[28px] border border-black/10 bg-[#fff7ea] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
                MagicHango
              </p>
              <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-black">
                {post.ctaTitle}
              </h2>
              <p className="mt-3 text-sm leading-6 text-black/62">
                {post.ctaDescription}
              </p>
              <AuthAwareBlogAction
                signedOutHref={post.ctaHref}
                signedOutLabel={post.ctaLabel}
                signedInHref={`/${locale}/myweek`}
                signedInLabel={ui.openApp}
                className="mt-5 inline-flex items-center justify-center rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-primary shadow-sm transition hover:bg-primary hover:text-white"
              />
            </div>
          </aside>
        </div>

        {relatedPosts.length > 0 ? (
          <section className="mt-12">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-black tracking-[-0.04em] text-black">
                {ui.relatedArticles}
              </h2>
              <Link
                href={`/${locale}/blog`}
                className="hidden rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm font-semibold text-black/70 transition hover:text-black md:inline-flex"
              >
                {ui.browseAll}
              </Link>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {relatedPosts.map((relatedPost) => (
                <BlogPostCard key={relatedPost.id} locale={locale} post={relatedPost} />
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
