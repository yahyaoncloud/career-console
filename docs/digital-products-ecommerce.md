# Digital Products Ecommerce Documentation

This document defines the product-page and commerce requirements for selling downloadable digital products such as technical notes, artworks, EVE-NG network diagrams, lab guides, templates, and study packs.

## Goal
Build a small, trustworthy ecommerce layer inside the portfolio so visitors can browse, evaluate, purchase, and download digital products without needing manual follow-up.

The store should feel like a professional technical catalog, not a generic marketplace. Product pages must help buyers quickly answer:

- What is this?
- Who is it for?
- What exactly do I get after purchase?
- Can I preview enough to trust the quality?
- What license or usage rights come with it?
- How do I receive updates?

## Product Types

### Notes
Notes are concise learning or reference products. They can be sold individually or bundled by topic.

Examples:
- Azure networking notes
- CCNA subnetting notes
- Linux troubleshooting notes
- Kubernetes command references
- Cloud interview prep notes

Recommended formats:
- PDF
- Markdown
- Notion export
- ZIP bundle containing PDF and source files

### Artworks
Artworks are visual digital assets that buyers can download and use according to a license.

Examples:
- Cloud architecture posters
- Network topology posters
- Terminal-themed wallpapers
- Technical icon packs
- Printable cheat-sheet designs

Recommended formats:
- PNG
- JPG
- SVG
- PDF print version
- ZIP bundle with multiple sizes

### EVE-NG Network Diagrams
EVE-NG products are lab files, topology diagrams, and supporting guides that help buyers recreate network scenarios.

Examples:
- BGP lab topology
- OSPF multi-area lab
- Firewall high availability lab
- Azure hybrid network simulation
- Campus network lab

Recommended formats:
- `.unl` EVE-NG lab file
- topology image
- startup configs
- lab guide PDF
- README
- device image requirements list

Important: product pages must clearly state that buyers are responsible for obtaining licensed vendor images required by EVE-NG.

### Guides
Guides are long-form learning products with a structured outcome.

Examples:
- Deploying a secure Azure landing zone
- Building a portfolio with React Router
- Setting up a monitoring stack
- Hardening Linux servers
- Resume and job-search playbooks

Recommended formats:
- PDF
- EPUB
- Markdown
- companion files
- sample configs

### Bundles
Bundles combine multiple products into a higher-value offer.

Examples:
- Azure Networking Starter Pack
- CCNA Lab Pack
- Cloud Engineer Interview Kit
- EVE-NG Firewall Lab Collection

Bundle pages should list every included product and show the total standalone value.

## Product Page Requirements

Each digital product should have a dedicated public page with the following sections.

### Hero
The hero section should make the product immediately understandable.

Required content:
- product title
- product category
- short outcome-driven subtitle
- primary preview image
- price
- purchase button
- file format badges
- update policy badge, if updates are included

Good subtitle examples:
- "A practical EVE-NG lab for learning BGP route filtering with real router configs."
- "Printable Azure networking notes for interview prep and day-to-day reference."
- "A polished cloud architecture poster pack for desks, classrooms, and presentations."

Avoid vague descriptions like:
- "Best notes for cloud"
- "Premium guide"
- "Useful files"

### Preview
Digital products need strong previews because buyers cannot physically inspect them.

Recommended preview types:
- watermarked PDF sample
- image gallery
- table of contents
- short video walkthrough
- topology screenshot
- sample config snippet
- before/after learning outcome

Preview rules:
- show enough detail to build trust
- watermark sample pages when needed
- never expose the full paid file publicly
- for EVE-NG labs, show topology and learning objectives without leaking all configs

### What Is Included
Every product page must explicitly list deliverables.

Example for an EVE-NG product:
- EVE-NG `.unl` lab file
- topology diagram PNG
- device startup configs
- step-by-step lab guide PDF
- troubleshooting checklist
- README with image requirements

Example for notes:
- PDF notes
- Markdown source
- printable version
- future errata updates

### Learning Outcome Or Use Case
Explain what the buyer can do after using the product.

Examples:
- "Practice BGP prefix filtering, route maps, and neighbor validation in a repeatable lab."
- "Review Azure networking concepts before interviews without searching through scattered docs."
- "Use ready-made cloud visuals in presentations, posts, or learning material."

### Audience
State who the product is for and who it is not for.

Examples:
- beginner-friendly
- intermediate cloud engineers
- network engineers preparing for labs
- students revising for exams
- creators who need technical artwork

This reduces refunds and mismatched expectations.

### Requirements
List dependencies before purchase.

For EVE-NG:
- EVE-NG Community or Pro
- minimum RAM and CPU
- required vendor images
- recommended browser
- basic networking knowledge

For guides and notes:
- PDF reader
- optional Markdown editor
- target skill level

For artwork:
- supported dimensions
- print size
- color mode if relevant
- commercial-use restrictions

### License
Every product must include clear usage rights.

Suggested license tiers:
- Personal: one buyer, personal learning or reference only
- Commercial: use in professional presentations, client work, or internal training
- Team: shared use within a small team or company
- Education: classroom or cohort use

Default license recommendation:
- notes, guides, and EVE-NG labs: Personal License
- artwork: Personal License with optional Commercial License upsell
- team training packs: Team License

License text should answer:
- Can the buyer share the files?
- Can the buyer resell or redistribute them?
- Can the buyer use artwork commercially?
- Can the buyer modify files?
- Can a company buy one copy for a team?

### Updates
Digital products often improve over time. State the update policy clearly.

Options:
- no updates included
- free minor updates for 12 months
- lifetime updates
- paid major-version upgrades

Recommended default:
- minor corrections and errata are free
- major new versions may be sold separately

### FAQ
Each product page should include a compact FAQ.

Common questions:
- How do I receive the files?
- Can I download again later?
- Do I need EVE-NG Pro?
- Are router/firewall images included?
- Can I use this for commercial work?
- Can I get a refund?
- Will I receive updates?

## Purchase Flow

The buying flow should be short and clear.

1. Visitor opens product page.
2. Visitor previews product details.
3. Visitor clicks purchase.
4. Checkout collects email and payment.
5. Payment succeeds.
6. System creates an order record.
7. System sends receipt email.
8. System unlocks download page.
9. Buyer downloads files.

Minimum checkout fields:
- email
- name, optional
- country, if tax handling requires it
- selected license
- discount code, optional

Avoid requiring account creation before purchase. Offer account creation after checkout if useful.

## Delivery Requirements

Digital delivery must be secure enough to prevent casual sharing while staying convenient for legitimate buyers.

Required behavior:
- generate a unique order ID
- generate download links after successful payment
- expire signed download URLs
- allow a limited number of downloads per order
- allow reissuing download links by email
- log download attempts

Recommended limits:
- signed URL expiry: 15-60 minutes
- download attempts: 5-10 per file
- link recovery: email-based order lookup

For large ZIP files, store assets outside the app repository in object storage such as S3 or Supabase Storage.

## Refund Policy

Digital products are hard to revoke after download, so refund terms must be visible before purchase.

Recommended policy:
- refunds are available for duplicate purchases
- refunds are available when files are broken and cannot be fixed
- no refunds after successful download for buyer's remorse
- support requests are handled before refund decisions

Use calm, direct wording. The policy should protect the seller without sounding hostile.

## Admin Product CMS

The admin product catalog should allow the owner to create and manage digital products.

### Product Fields

Required fields:
- title
- slug
- status: draft, published, archived
- product type
- short description
- full description
- price
- currency
- license type
- cover image
- preview assets
- deliverable files
- file formats
- version
- update policy
- support email
- refund policy
- created date
- updated date

Optional fields:
- compare-at price
- bundle contents
- tags
- difficulty level
- estimated completion time
- tool requirements
- changelog
- SEO title
- SEO description
- featured flag

### Product Statuses

Draft:
- visible only in admin
- used while editing

Published:
- visible on public store pages
- available for checkout

Archived:
- hidden from new buyers
- still available to previous buyers from their order history

### File Management

Admin should support:
- uploading product files
- replacing files with new versions
- attaching preview-only files
- marking a file as paid-only
- storing file size and checksum
- showing last updated date

For EVE-NG products, include a structured requirement list:
- required node images
- tested EVE-NG version
- expected RAM
- expected CPU
- included configs
- unsupported images or versions

## Storefront Pages

### Product Listing Page

The listing page should support browsing and filtering.

Recommended filters:
- product type
- topic
- difficulty
- price range
- format
- license

Recommended sorting:
- newest
- most popular
- price low to high
- price high to low
- recently updated

Product cards should show:
- cover image
- title
- type
- short description
- price
- format badges
- rating or review count, if available

### Product Detail Page

The detail page should prioritize trust and clarity.

Recommended layout:
- hero with preview and purchase panel
- overview
- included files
- preview gallery
- requirements
- license
- FAQ
- related products

For technical products, avoid marketing-heavy copy. Buyers need precise scope, prerequisites, and deliverables.

### Thank You Page

After checkout, show:
- order confirmation
- download links
- receipt email status
- support contact
- license reminder

Do not rely only on email delivery. The browser page should provide immediate access after successful payment.

## Suggested Database Model

Product:
- id
- title
- slug
- status
- type
- summary
- description
- priceCents
- currency
- coverImageUrl
- previewAssetUrls
- metadataJson
- licenseType
- version
- updatePolicy
- createdAt
- updatedAt

ProductFile:
- id
- productId
- label
- storageKey
- fileName
- fileSizeBytes
- mimeType
- checksum
- accessLevel: preview or paid
- version
- createdAt

Order:
- id
- email
- buyerName
- status
- totalCents
- currency
- paymentProvider
- paymentIntentId
- createdAt

OrderItem:
- id
- orderId
- productId
- licenseType
- priceCents
- productVersion

DownloadGrant:
- id
- orderItemId
- tokenHash
- expiresAt
- downloadLimit
- downloadCount
- createdAt

DownloadEvent:
- id
- grantId
- productFileId
- ipAddress
- userAgent
- createdAt

## Payment Provider

Recommended provider:
- Stripe Checkout for card payments and simple digital goods checkout

Stripe objects to use:
- Product
- Price
- Checkout Session
- Payment Intent
- Webhook event

Required webhook handling:
- verify webhook signature
- listen for successful checkout completion
- create order records only after confirmed payment
- generate download grants
- send receipt and download email

Never trust the browser alone to mark an order as paid.

## SEO Requirements

Each product page should include:
- unique title
- unique meta description
- canonical URL
- Open Graph image
- product structured data
- clean slug

Slug examples:
- `/store/azure-networking-notes`
- `/store/eve-ng-bgp-route-filtering-lab`
- `/store/cloud-architecture-poster-pack`

Meta description should name the product type and outcome.

Example:
`Download a practical EVE-NG BGP route filtering lab with topology, configs, and a step-by-step PDF guide.`

## Security Requirements

Required:
- validate product IDs and order IDs server-side
- never expose storage keys directly
- use signed URLs for paid files
- verify payment webhooks
- rate-limit download recovery
- store token hashes, not raw download tokens
- avoid putting paid files in the public folder
- log failed download attempts

Optional:
- watermark buyer email into generated PDFs
- add license key to download package
- alert admin on suspicious download volume

## Analytics

Track events that help improve products.

Recommended events:
- product viewed
- preview opened
- purchase clicked
- checkout started
- checkout completed
- download started
- download failed
- refund requested

Important metrics:
- conversion rate by product
- preview-to-purchase rate
- refund rate
- support requests by product
- most downloaded file formats

## Content Standards

Product copy should be specific and concrete.

Use:
- exact deliverables
- tested versions
- file formats
- skill level
- estimated time
- requirements
- clear license terms

Avoid:
- exaggerated claims
- unclear "premium" language
- hidden requirements
- vague bundle contents
- screenshots that do not match the final download

## Launch Checklist

Before publishing a product:

- Product title and slug are final.
- Price and currency are correct.
- Cover image is uploaded.
- Preview files are safe to expose.
- Paid files are uploaded outside the public folder.
- File downloads have been tested.
- Checkout succeeds in test mode.
- Webhook creates an order.
- Download email is delivered.
- Download page works immediately after payment.
- License is visible.
- Refund policy is visible.
- Requirements are listed.
- SEO title and description are set.
- Product is marked as published.

## First Implementation Scope

Recommended first version:

- Admin product CRUD
- Public product listing page
- Public product detail page
- Stripe Checkout integration
- Webhook-based order creation
- Signed download links
- Download confirmation page
- Email delivery for receipt and files

Defer until later:

- reviews
- coupons
- affiliate links
- subscriptions
- tax automation
- team license management
- buyer accounts
- watermark generation

## Example Product Page Template

```md
# Product Title

Short outcome-driven subtitle.

## Price

$19 Personal License

## What You Get

- File 1
- File 2
- File 3

## Who It Is For

Describe the target buyer.

## Requirements

- Required tool or software
- Skill level
- Version requirements

## Preview

Screenshots, sample pages, or topology images.

## License

Explain what the buyer can and cannot do.

## Updates

Explain whether updates are included.

## FAQ

Answer common purchase questions.
```

