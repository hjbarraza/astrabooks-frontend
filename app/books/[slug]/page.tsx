import {
  getBookBySlug,
  getFeaturedMediaById,
  getAuthorById,
  getCategoryById,
  getAllBooks,
} from "@/lib/wordpress";

import { Section, Container, Article, Prose } from "@/components/craft";
import { badgeVariants } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/site.config";

import Link from "next/link";
import Balancer from "react-wrap-balancer";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import type { Metadata } from "next";

export async function generateStaticParams() {
  const books = await getAllBooks();

  return books.map((book) => ({
    slug: book.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBookBySlug(slug);

  if (!book) {
    return {};
  }

  const ogUrl = new URL(`${siteConfig.site_domain}/api/og`);
  ogUrl.searchParams.append("title", book.title.rendered);
  // Strip HTML tags for description
  const description = book.excerpt.rendered.replace(/<[^>]*>/g, "").trim();
  ogUrl.searchParams.append("description", description);

  return {
    title: book.title.rendered,
    description: description,
    openGraph: {
      title: book.title.rendered,
      description: description,
      type: "article",
      url: `${siteConfig.site_domain}/books/${book.slug}`,
      images: [
        {
          url: ogUrl.toString(),
          width: 1200,
          height: 630,
          alt: book.title.rendered,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: book.title.rendered,
      description: description,
      images: [ogUrl.toString()],
    },
  };
}

// Utility to convert <p>## ...</p> to <h2>...</h2>
function convertMarkdownHeadingsInHtml(html: string): string {
  return html.replace(/<p>##\s*(.*?)<\/p>/g, '<h2>$1</h2>');
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  const featuredMedia = book.featured_media
    ? await getFeaturedMediaById(book.featured_media)
    : null;
  const author = await getAuthorById(book.author);
  const date = new Date(book.date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  let category = null;
  if (book.categories && book.categories.length > 0) {
    category = await getCategoryById(book.categories[0]);
  }

  const processedContent = convertMarkdownHeadingsInHtml(book.content?.rendered || '');

  return (
    <Section>
      <Container>
        <Prose>
          <h1>
            <Balancer>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {book.title?.raw || book.title?.rendered || ''}
              </ReactMarkdown>
            </Balancer>
          </h1>
          <div className="flex justify-between items-center gap-4 text-sm mb-4">
            <h5>
              Published {date} by{" "}
              {author.name && (
                <span>
                  <a href={`/books/?author=${author.id}`}>{author.name}</a>{" "}
                </span>
              )}
            </h5>

            {/* Category link, only if category exists */}
            {category && (
              <Link
                href={`/books/?category=${category.id}`}
                className={cn(
                  badgeVariants({ variant: "outline" }),
                  "!no-underline"
                )}
              >
                {category.name}
              </Link>
            )}
          </div>
          {featuredMedia?.source_url && (
            <div className="h-96 my-12 md:h-[500px] overflow-hidden flex items-center justify-center border rounded-lg bg-accent/25">
              {/* eslint-disable-next-line */}
              <img
                className="w-full h-full object-cover"
                src={featuredMedia.source_url}
                alt={book.title.rendered}
              />
            </div>
          )}
        </Prose>

        <Article dangerouslySetInnerHTML={{ __html: processedContent }} />
      </Container>
    </Section>
  );
}
