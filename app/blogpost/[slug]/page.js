// app/blogpost/[slug]/page.js
import BlogPost from "@/components/Blog/BlogPost/BlogPost";
import { shubukan_api } from "@/config";
import { redirect } from "next/navigation";

async function getBlogPost(slug) {
  try {
    const response = await shubukan_api.get(`/blog/${slug}`, {
      cache: "no-store",
    });

    if (response.status === 400 || response.data.message === 400) {
      return null;
    }

    return response.data;
  } catch (error) {
    // Handle 404 silently - this is expected for non-existent blogs
    if (error.response?.status === 404) {
      return null;
    }

    // Only log unexpected errors
    console.error("Unexpected error fetching blog:", error);
    return null;
  }
}

// Cache the blog post to avoid multiple API calls
let blogPostCache = new Map();

async function getCachedBlogPost(slug) {
  if (!blogPostCache.has(slug)) {
    const blogPost = await getBlogPost(slug);
    blogPostCache.set(slug, blogPost);
  }
  return blogPostCache.get(slug);
}

// ✅ Add metadata for SEO + social sharing
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const blogPost = await getCachedBlogPost(slug);

  if (!blogPost) {
    return {
      title: "Blog Not Found | Shubukan India",
      description: "This blog post could not be found.",
      robots: { index: false, follow: false }, // prevent indexing missing pages
    };
  }

  const url = `https://www.shubukanindia.org/blogpost/${blogPost.slug}`;
  const image = blogPost.thumbnailImage?.url || blogPost.coverImage?.url;

  return {
    title: blogPost.title,
    description: blogPost.summary || blogPost.subtitle,
    keywords: blogPost.tags?.join(", "),
    authors: blogPost.authors?.map((a) => a.name),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: blogPost.title,
      description: blogPost.summary || blogPost.subtitle,
      url,
      type: "article",
      publishedTime: blogPost.publishedDate,
      modifiedTime: blogPost.modifiedDate || blogPost.updatedAt,
      authors: blogPost.authors?.map((a) => a.name),
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: blogPost.thumbnailImage?.altText || blogPost.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: blogPost.title,
      description: blogPost.summary || blogPost.subtitle,
      images: [image],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  const blogPost = await getCachedBlogPost(slug);

  if (!blogPost) {
    redirect("/blogpost/blog-not-found");
  }

  await shubukan_api
    .post(`/blog/${slug}/view`)
    .catch((err) => console.error("View track error:", err));

  return <BlogPost blog={blogPost} />;
}
