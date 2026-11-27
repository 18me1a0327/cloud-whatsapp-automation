# Cloud WhatsApp Automation

Reusable cloud-hosted WhatsApp notification scheduler for opted-in customer and service communications.

## Stack
- Next.js App Router
- Netlify Scheduled Functions
- Neon PostgreSQL
- WhatsApp Business Platform Cloud API

## Included
- Public status endpoint: `GET /api/health`
- Authenticated scheduling endpoint: `POST /api/schedule`
- Scheduled sender: checks for due messages every five minutes (UTC)
- Neon schema for contacts, consent, scheduled messages, and API response status

## Deploy
1. Make this repository private before adding live configuration or customer data.
2. Connect the repository to a new Netlify site.
3. Add `DATABASE_URL`, `ADMIN_API_KEY`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_API_VERSION`, and `WHATSAPP_SENDING_ENABLED=false` in Netlify environment variables with Functions scope.
4. Run `database/schema.sql` in Neon SQL Editor.
5. Deploy, configure your Meta WhatsApp Business number and approved templates, then add only contacts with explicit opt-in.

## Schedule a message
Send `POST /api/schedule` with `Authorization: Bearer YOUR_ADMIN_API_KEY` and JSON fields: `phoneE164`, `templateName`, `languageCode`, `scheduledAt` (ISO 8601), `consentConfirmed: true`, and `consentSource`.

An opted-out contact cannot be silently reactivated by this endpoint. Only approved WhatsApp template messages are sent. API acceptance is not delivery confirmation; add Meta delivery webhooks before treating a message as delivered.

## Cost and policy
Free hosting does not make WhatsApp API messages free. Meta pricing, approved-template rules, consent requirements, and quality limits apply. Outbound sending is disabled unless `WHATSAPP_SENDING_ENABLED` is exactly `true`.
