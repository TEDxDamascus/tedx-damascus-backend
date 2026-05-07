# Database Schema

This project uses MongoDB via Mongoose.

- Connection source: `src/app.module.ts`
- Default database name: `tedx-damascus`

## Implemented Collections

### `homesettings`

Defined in `src/home-settings/entities/home-settings.entity.ts`.

```js
{
  _id: ObjectId,

  hero: {
    isVisible: Boolean, // default: true
    order: Number,
    settings: Object
  },

  sections: {
    [sectionKey]: {
      isVisible: Boolean, // default: true
      order: Number,
      settings: Object
    }
  },

  createdAt: Date,
  updatedAt: Date
}
```

### `categories`

Defined in `src/categories/entities/category.entity.ts`.

```js
{
  _id: ObjectId,

  name: {
    ar: String,   // required
    en: String    // required
  },

  description: {
    ar: String,   // required
    en: String    // required
  },

  createdAt: Date,
  updatedAt: Date
}
```

### `blogs`

Defined in `src/blogs/entities/blog.entity.ts`.

```js
{
  _id: ObjectId,

  title: {
    ar: String,   // required
    en: String    // required
  },

  slug: {
    ar: String,   // required, unique when non-empty
    en: String    // required, unique when non-empty
  },

  blog_image: ObjectId, // ref: Image, optional
  og_image: ObjectId,   // ref: Image, optional

  description: {
    ar: String,   // default: ''
    en: String    // default: ''
  },

  content: {
    ar: String,   // required
    en: String    // required
  },

  tags: {
    ar: [String],
    en: [String]
  },

  status: String,        // default: 'draft'
  publishedAt: Date,     // optional
  category_id: ObjectId, // ref: Category, optional
  user_id: ObjectId,     // ref: User, optional
  views_count: Number,   // default: 0
  read_time: Number,     // default: 0

  meta_title: {
    ar: String,
    en: String
  },

  meta_description: {
    ar: String,
    en: String
  },

  meta_keywords: {
    ar: [String],
    en: [String]
  },

  canonical_url: String, // optional

  og_title: {
    ar: String,
    en: String
  },

  og_description: {
    ar: String,
    en: String
  },

  gallery: [ObjectId],   // ref: Image[]
  related_blogs_ids: [ObjectId], // ref: Blog[]

  createdAt: Date,
  updatedAt: Date
}
```

Blog API responses also include response-only computed fields:

- `user_name`: resolved from `user_id` using the external `users` collection when available
- `references`: list of records from the `blogreferences` collection for the blog
- `prev_blog` / `next_blog`: sibling blog summaries on `GET /blogs/:id`
- `seo`: resolved SEO fallback values
- `json_ld`: localized Article structured data

`GET /blogs` supports language filtering with `language=ar`, `language=en`,
`lang=ar`, or `lang=en`. The filter returns blogs that have non-empty content
for that locale.

### `blogreferences`

Defined in `src/blog-references/entities/blog-reference.entity.ts`.

```js
{
  _id: ObjectId,

  blog_id: ObjectId, // ref: Blog, required

  name: String, // required
  desc: String, // default: ''
  url: String,  // required

  createdAt: Date,
  updatedAt: Date
}
```

## Indexes

- Unique index on `slug.en` when it exists and is not empty
- Unique index on `slug.ar` when it exists and is not empty
- Index on `blogreferences.blog_id`

## Referenced External Collections

These collections are referenced by ObjectId fields but do not currently have
local Mongoose entity definitions in this codebase:

- `images`: referenced by `blog_image`, `og_image`, and `gallery`
- `users`: referenced by optional blog `user_id`

## Placeholder Entities

These files exist, but they do not currently define any schema fields:

- `src/auth/entities/auth.entity.ts`
- `src/events/entities/event.entity.ts`
- `src/speakers/entities/speaker.entity.ts`
