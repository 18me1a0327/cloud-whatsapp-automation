# Cloud WhatsApp Automation

Reusable cloud-hosted WhatsApp notification scheduler for opted-in customer and service communications.

## Stack
- Next.js App Router
- Netlify Scheduled Functions
- Neon PostgreSQL
- WhatsApp Business Platform Cloud API

## Deploy
1. Make this repository private before adding real configurations or customer data.
2. Connect it to a new Netlify site.
3. Add the following under Netlify environment variables with Functions scope: DATABASE_URL, WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_API_VERSION, WHATSAPP_SENDING_ENABLED=false.
4. Run database/schema.sql in Neon SQL Editor.
5. Deploy. The scheduled sender checks for due messages every five minutes (UTC).
6. Configure your Meta WhatsApp Business number and approved message templates.
7. Add only contacts with explicit opt-in.

The sender is fail-closed: it sends nothing unless WHATSAPP_SENDING_ENABLED is exactly true. WhatsApp API acceptance is not proof of delivery. Add Meta delivery webhooks before relying on delivery status. Free hosting does not make WhatsApp API messages free; Meta pricing and messaging policies apply.
