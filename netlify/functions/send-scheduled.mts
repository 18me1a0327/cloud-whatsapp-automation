import type { Config } from "@netlify/functions";
import { neon } from "@neondatabase/serverless";

type DueMessage = {
  id: number;
  contact_id: number;
  phone_e164: string;
  template_name: string;
  language_code: string;
};

const env = (key: string) => Netlify.env.get(key);

export default async function sendScheduled() {
  if (env("WHATSAPP_SENDING_ENABLED") !== "true") {
    console.log("WhatsApp sender disabled; no messages sent.");
    return;
  }

  const databaseUrl = env("DATABASE_URL");
  const accessToken = env("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = env("WHATSAPP_PHONE_NUMBER_ID");
  const apiVersion = env("WHATSAPP_API_VERSION");

  if (!databaseUrl || !accessToken || !phoneNumberId || !apiVersion) {
    console.error("WhatsApp sender configuration incomplete.");
    return;
  }

  const sql = neon(databaseUrl);
  const due = await sql<DueMessage[]>\`
    WITH picked AS (
      SELECT m.id
      FROM scheduled_messages m
      JOIN contacts c ON c.id = m.contact_id
      WHERE m.status = 'pending'
        AND m.scheduled_at <= NOW()
        AND c.opted_in_at IS NOT NULL
        AND c.opted_out_at IS NULL
      ORDER BY m.scheduled_at ASC
      LIMIT 10
      FOR UPDATE OF m SKIP LOCKED
    )
    UPDATE scheduled_messages m
    SET status = 'processing',
        attempts = attempts + 1,
        updated_at = NOW()
    FROM picked, contacts c
    WHERE m.id = picked.id AND c.id = m.contact_id
    RETURNING m.id, m.contact_id, c.phone_e164,
              m.template_name, m.language_code
  \`;

  for (const message of due) {
    try {
      const consent = await sql\`
        SELECT id FROM contacts
        WHERE id = ${message.contact_id}
          AND opted_in_at IS NOT NULL
          AND opted_out_at IS NULL
      \`;

      if (consent.length === 0) {
        await sql\`
          UPDATE scheduled_messages
          SET status = 'cancelled', updated_at = NOW()
          WHERE id = ${message.id}
        \`;
        continue;
      }

      const response = await fetch(
        "https://graph.facebook.com/" + apiVersion + "/" + phoneNumberId + "/messages",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + accessToken,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: message.phone_e164,
            type: "template",
            template: {
              name: message.template_name,
              language: { code: message.language_code }
            }
          }),
          signal: AbortSignal.timeout(15000)
        }
      );

      const payload = await response.json() as {
        messages?: Array<{ id?: string }>;
        error?: { message?: string };
      };

      if (!response.ok) {
        throw new Error(payload.error?.message ?? "WhatsApp API error " + response.status);
      }

      await sql\`
        UPDATE scheduled_messages
        SET status = 'accepted',
            whatsapp_message_id = ${payload.messages?.[0]?.id ?? null},
            last_error = NULL,
            updated_at = NOW()
        WHERE id = ${message.id}
      \`;
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown send error";
      await sql\`
        UPDATE scheduled_messages
        SET status = 'failed',
            last_error = ${detail.slice(0, 1000)},
            updated_at = NOW()
        WHERE id = ${message.id}
      \`;
      console.error("WhatsApp send failed", { messageId: message.id, detail });
    }
  }

  console.log("Processed " + due.length + " due message(s).");
}

export const config: Config = {
  schedule: "*/5 * * * *"
};
