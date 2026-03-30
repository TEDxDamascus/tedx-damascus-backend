# Blogs Localization and SEO Tasks by Nour

## What was implemented

- Added full bilingual `{ ar, en }` support for blog `title`, `description`, `content`, `slug`, `meta_title`, `meta_description`, `meta_keywords`, `og_title`, and `og_description`.
- Added locale-aware slug generation.
- Added unique MongoDB indexes for `slug.en` and `slug.ar`.
- Added SEO fields:
  - `meta_title`
  - `meta_description`
  - `meta_keywords`
  - `canonical_url`
  - `blog_image`
  - `og_image`
  - `og_title`
  - `og_description`
- Added fallback behavior in API responses:
  - `meta_title` falls back to `title`
  - `meta_description` falls back to `description`
  - `og_title` falls back to `meta_title`
  - `og_description` falls back to `meta_description`
  - `og_image` falls back to `blog_image`
  - `canonical_url` falls back to a generated URL based on the slug
- Added JSON-LD structured data in blog responses under `json_ld.ar` and `json_ld.en`.
- Added `prev_blog` and `next_blog` to `GET /blogs/:id`.
- Added absolute media URL resolution for the blog cover image and Open Graph image when Supabase config is available.

## Notes

- There was no separate `excerpt` field in the pulled schema, so `description` is used as the fallback for `meta_description`.
- Canonical URL generation uses `APP_URL`, then `FRONTEND_URL`, and finally falls back to `http://localhost:3000`.
- JSON-LD author defaults to `TEDx Damascus` unless `BLOG_AUTHOR_NAME` is set.
- Media URL resolution uses `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL`, plus one of:
  - `SUPABASE_STORAGE_BUCKET`
  - `SUPABASE_BUCKET`
  - `SUPABASE_MEDIA_BUCKET`
