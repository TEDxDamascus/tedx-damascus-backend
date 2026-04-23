# PR Title

Add blog categories and home settings CRUD with schema and Postman updates

# PR Description

This PR includes the backend work completed on April 22, 2026 and April 23, 2026.


- Added a new `categories` collection
- Implemented full CRUD for categories
- Updated blogs to use `category_id` instead of a plain category text field
- Linked blogs with categories using a MongoDB reference
- Updated blog create, update, list, and single-item responses to support populated category data
- Updated the database schema documentation
- Added Postman requests and examples for categories and blogs


- Added a new `homesettings` collection
- Implemented full CRUD for home settings
- Added support for the structure:

```json
{
  "hero": {
    "isVisible": true
  }
}
```

- Updated the database schema documentation
- Added Postman requests and examples for home settings

# Notes

- Build was verified successfully
- Postman collection was updated and validated
