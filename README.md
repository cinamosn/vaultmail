# VaultMail - Serverless Disposable Mail

A premium, disposable email service deployed on Vercel with support for custom domains.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

-   **Zero Server Maintenance**: Runs entirely on Vercel (Next.js + Vercel KV).
-   **Custom Domains**: Bring your own domain via Mailgun, SendGrid, or Cloudflare.
-   **Real-time**: Inbox auto-refreshes.
-   **Privacy Focused**: Emails stored in Redis with a 24-hour TTL (Auto-expiry).
-   **Premium UI**: Glassmorphism, Dark Mode, and Responsive design.

## Architecture

1.  **Incoming Mail**: DNS MX Records point to your email provider (e.g., Mailgun).
2.  **Webhook**: Provider receives email, parses it, and POSTs JSON to `https://your-app.vercel.app/api/webhook`.
3.  **Storage**: App stores email in Vercel KV (Redis).
4.  **UI**: User polls the API to see emails for their generated address.

## Deployment Guide

### 1. Deploy to Vercel

Clone this repository and deploy it to Vercel.

You will need to create a **Vercel KV** database (storage tab) and link it to your project. This will automatically set:
-   `KV_REST_API_URL`
-   `KV_REST_API_TOKEN`

### 2. Configure Email Receiving (The Custom Domain Part)

Since Vercel does not accept SMTP traffic directly, you need a service to receive the email and forward it to your app via Webhook.

#### Option A: Mailgun (Recommended for ease of use)
1.  Add your domain to Mailgun.
2.  Configure MX records as instructed by Mailgun.
3.  Go to **Receiving** (Routes).
4.  Create a Route:
    -   **Expression**: `Match Recipient` -> `(.*)@yourdomain.com`
    -   **Actions**: `Forward` -> `https://your-project.vercel.app/api/webhook`
    -   (Mailgun sends form-data, but Next.js `req.json()` might fail if it's form-data. *Note: The provided webhook currently expects JSON. If using Mailgun, you might need to adjust the webhook to parse FormData.*)

#### Option B: Cloudflare Email Workers (Free)
1.  Set up Cloudflare Email Routing for your domain.
2.  Create a Worker with the following logic:
    ```javascript
    import PostalMime from 'postal-mime';

    export default {
      async email(message, env, ctx) {
        const parser = new PostalMime();
        const email = await parser.parse(message.raw);
        
        await fetch('https://your-project.vercel.app/api/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: message.from,
            to: message.to,
            subject: message.headers.get('subject'),
            text: email.text,
            html: email.html
          })
        });
      }
    };
    ```
3.  Bind the Worker to a "Catch-All" route.

### 3. Usage

1.  Open your deployed app.
2.  Enter your domain (e.g., `my-custom-domain.com`) in the domain input box.
3.  Click "Generate New".
4.  Send an email to that address from your personal email.
5.  Wait a few seconds for it to appear!

## Local Development

1.  `npm install`
2.  Set up a local Redis or use Vercel KV credentials in `.env.local`.
3.  `npm run dev`
