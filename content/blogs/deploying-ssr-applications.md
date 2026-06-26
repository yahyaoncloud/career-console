---
title: Deploying SSR Applications - From Static to Containers
date: 2026-06-28
excerpt: A comprehensive guide on taking a Server-Side Rendered (SSR) app from a basic static asset deployment to AWS Amplify, VMs, and eventually ECS.
tags: SSR, Next.js, AWS, ECS, Amplify
---

# Deploying SSR Applications: From Static to Containers

Server-Side Rendering (SSR) frameworks like Next.js or Nuxt present unique deployment challenges because they require a Node.js runtime, unlike purely static Single Page Applications (SPAs).

## Phase 1: The Static Export (SSG)

If your application doesn't strictly need runtime data fetching, the easiest deployment path is static exporting (Static Site Generation).

```bash
next build
next export # (or output: 'export' in next.config.js for newer versions)
```

The resulting `out/` directory can be dumped into an AWS S3 bucket and served via CloudFront.

## Phase 2: AWS Amplify Hosting

When you need true SSR (e.g., `getServerSideProps`), S3 won't cut it. AWS Amplify provides a fully managed hosting environment that automatically provisions Lambda@Edge functions to handle SSR rendering.

Simply connect your GitHub repository, and Amplify handles the CI/CD pipeline, Edge caching, and serverless compute scaling.

## Phase 3: Virtual Machines (EC2)

Sometimes serverless compute has limitations (e.g., execution timeouts, cold starts, or lack of persistent connections). Deploying to a raw EC2 instance gives you complete control.

1. Provision an EC2 instance.
2. Install Node.js and PM2.
3. Configure NGINX as a reverse proxy.

```nginx
server {
    listen 80;
    server_name myapp.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Phase 4: Containerization with ECS

For true enterprise scale, package your SSR app in a Docker container and deploy it to Amazon ECS using Fargate.

### Example Dockerfile

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

## Summary

Start simple. Use Amplify for fast iterations, and graduate to Docker and ECS when your application requires complex custom networking, persistent connections, or specialized compute scaling.
