# tedx-damascus-backend

TEDx Damascus main website and dashboard - Backend (API)

translations will be at the service Level Mostly :3

things needs to be translated

# Event:

title
description
brief
location

# Speaker:

name
bio
description
Team:
name
bio
description

# Sponsor:

name
description
Organizer:
name
bio
description

# Blog:

title
description
content
meta_title
meta_description

//
added a translationDto that can be used in the DTOs (no need for further validation its validated)
added a translationField that can be used (a type to use in the schemas :P)
added a translate function helper fun


```
tedx-damascus-backend
├─ .nvmrc
├─ .prettierrc
├─ env
├─ env.example
├─ eslint.config.mjs
├─ nest-cli.json
├─ package.json
├─ pnpm-lock.yaml
├─ README.md
├─ src
│  ├─ app.controller.spec.ts
│  ├─ app.controller.ts
│  ├─ app.module.ts
│  ├─ app.service.ts
│  ├─ auth
│  │  ├─ auth.controller.spec.ts
│  │  ├─ auth.controller.ts
│  │  ├─ auth.module.ts
│  │  ├─ auth.service.spec.ts
│  │  ├─ auth.service.ts
│  │  ├─ dto
│  │  │  ├─ create-auth.dto.ts
│  │  │  └─ update-auth.dto.ts
│  │  └─ entities
│  │     └─ auth.entity.ts
│  ├─ common
│  │  ├─ dto
│  │  │  └─ translation.dto.ts
│  │  ├─ type
│  │  │  └─ translation-field.ts
│  │  └─ utils
│  │     ├─ translate.helper.ts
│  │     └─ translation.schema.ts
│  ├─ doc
│  │  └─ scala.doc.ts
│  ├─ events
│  │  ├─ dto
│  │  │  ├─ create-event.dto.ts
│  │  │  └─ update-event.dto.ts
│  │  ├─ enums
│  │  │  ├─ event-status.enum.ts
│  │  │  └─ event-type.enum.ts
│  │  ├─ events.controller.spec.ts
│  │  ├─ events.controller.ts
│  │  ├─ events.module.ts
│  │  ├─ events.service.spec.ts
│  │  ├─ events.service.ts
│  │  ├─ pipes
│  │  │  ├─ parse-id.pipe.spec.ts
│  │  │  └─ parse-id.pipe.ts
│  │  └─ schema
│  │     └─ event.schema.ts
│  ├─ i18n
│  │  ├─ ar
│  │  │  └─ test.json
│  │  └─ en
│  │     └─ test.json
│  ├─ main.ts
│  └─ speakers
│     ├─ dto
│     │  ├─ create-speaker.dto.ts
│     │  └─ update-speaker.dto.ts
│     ├─ entities
│     │  └─ speaker.entity.ts
│     ├─ speakers.controller.spec.ts
│     ├─ speakers.controller.ts
│     ├─ speakers.module.ts
│     ├─ speakers.service.spec.ts
│     └─ speakers.service.ts
├─ test
│  ├─ app.e2e-spec.ts
│  └─ jest-e2e.json
├─ tsconfig.build.json
└─ tsconfig.json

```