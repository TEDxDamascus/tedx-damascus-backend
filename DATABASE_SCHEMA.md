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
    isVisible: Boolean // default: true
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

  status: String,        // default: 'draft'
  publishedAt: Date,     // optional
  category_id: ObjectId, // ref: Category, optional
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
    ar: String,
    en: String
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

  createdAt: Date,
  updatedAt: Date
}
```

## Indexes

- Unique index on `slug.en` when it exists and is not empty
- Unique index on `slug.ar` when it exists and is not empty

## Placeholder Entities

These files exist, but they do not currently define any schema fields:

- `src/auth/entities/auth.entity.ts`
- `src/events/entities/event.entity.ts`
- `src/speakers/entities/speaker.entity.ts`
