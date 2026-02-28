Dynamic Forms and Surveys Service Design Document
Purpose

This service enables admins to create dynamic forms and surveys similar to Google Forms, publish them, and collect one time submissions from target users based on role (Speaker, Partner, Attender). Users can fill a published form once, submit it, and later view their submitted answers. Admins can review only submitted responses.

This document is intended to be used by an implementation agent to build the module end to end.

In scope

Create form templates (Draft).

Add ordered questions of multiple types.

Add options for option based questions.

Publish forms.

Render forms on frontend using a single schema response.

Allow users to submit once.

Store answers per question.

Allow users to view their submitted response.

Allow admins to list and view submitted responses only.

Support Arabic and English for all user facing form content.

Roles and permissions
Roles

Admin

Creates and manages forms.

Publishes forms.

Reviews submissions.

Target User

Any authenticated user whose role matches a form’s target_role.

Fills and submits forms.

Views their own submitted answers.

Core features
Admin features

Form Template Authoring

Create a template with:

name (en, ar)

description (en, ar, optional)

target role (Speaker, Partner, Attender)

status (Draft by default)

Question Management

Add questions to a form in a specific order (order_index).

Supported question types:

short_text

long_text

single_choice

multi_choice

checkbox_group

date

Each question includes:

title (en, ar)

help text (en, ar optional)

required flag

type specific config (min/max length, min/max date, min/max selected, etc.)

Options Management

For single_choice, multi_choice, checkbox_group:

define ordered options with bilingual labels

Publish

Set template status to Published and store published timestamp.

Enforce immutability:

reject any update to template/questions/options after published.

Review Submissions

List submissions for a form, only submitted.

View a submission with merged answers by question.

User features

Discover available forms

List forms where:

status = Published

target_role matches user role

Load a form schema

One API call returns:

form metadata

ordered questions

options embedded for option based types

Submit once

Submit answers as a list keyed by questionId.

Backend validates required and type rules.

Creates a single submission record and answer records.

Enforces unique submission per user per form.

View own submitted response

User retrieves their submission:

schema + answers keyed by question id, or answers embedded per question.


ERD:

erDiagram
  USERS {
    uuid id PK
    string email
    string role
    datetime created_at
    datetime updated_at
  }

  FORM_TEMPLATES {
    uuid id PK
    uuid created_by_admin_id FK
    string target_role
    string status
    jsonb name_i18n
    jsonb description_i18n
    datetime published_at
    datetime created_at
    datetime updated_at
  }

  FORM_QUESTIONS {
    uuid id PK
    uuid form_template_id FK
    int order_index
    string type
    jsonb title_i18n
    jsonb help_text_i18n
    boolean is_required
    jsonb config
    datetime created_at
    datetime updated_at
  }

  QUESTION_OPTIONS {
    uuid id PK
    uuid question_id FK
    int order_index
    jsonb label_i18n
    datetime created_at
    datetime updated_at
  }

  FORM_SUBMISSIONS {
    uuid id PK
    uuid form_template_id FK
    uuid user_id FK
    string status
    datetime submitted_at
    datetime created_at
  }

  SUBMISSION_ANSWERS {
    uuid id PK
    uuid submission_id FK
    uuid question_id FK
    string value_text
    date value_date
    boolean value_bool
    uuid value_option_id
    jsonb value_option_ids
    datetime created_at
    datetime updated_at
  }

  USERS ||--o{ FORM_TEMPLATES : "creates"
  FORM_TEMPLATES ||--o{ FORM_QUESTIONS : "has"
  FORM_QUESTIONS ||--o{ QUESTION_OPTIONS : "has"
  USERS ||--o{ FORM_SUBMISSIONS : "submits"
  FORM_TEMPLATES ||--o{ FORM_SUBMISSIONS : "receives"
  FORM_SUBMISSIONS ||--o{ SUBMISSION_ANSWERS : "contains"
  FORM_QUESTIONS ||--o{ SUBMISSION_ANSWERS : "answered_by"

  Question types and expected config
Common fields for all questions

type enum

title_i18n, help_text_i18n

is_required

order_index

Config examples

short_text, long_text:

min_length (optional)

max_length (optional)

regex (optional, use carefully)

single_choice:

no required config beyond options, optional allow_other later

multi_choice, checkbox_group:

min_selected (optional)

max_selected (optional)

date:

min_date (optional)

max_date (optional)