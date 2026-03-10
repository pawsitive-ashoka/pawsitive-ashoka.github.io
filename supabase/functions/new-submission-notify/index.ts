// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// Required env vars:
// SUBMISSION_WEBHOOK_SECRET, RESEND_API_KEY, TEAM_NOTIFY_EMAIL
// Optional: FROM_EMAIL
// Required for fallback DB logging: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const webhookSecret = Deno.env.get("SUBMISSION_WEBHOOK_SECRET") || "";
const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";
const notifyEmail = Deno.env.get("TEAM_NOTIFY_EMAIL") || "";
const fromEmail = Deno.env.get("FROM_EMAIL") || "Pawsitive <onboarding@resend.dev>";
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function logFailure(
  submissionId: string,
  errorMessage: string,
  errorDetails: Record<string, unknown> = {},
): Promise<void> {
  if (!supabaseUrl || !supabaseServiceRoleKey) return;

  const payload = {
    submission_id: submissionId || null,
    provider: "resend",
    error_message: errorMessage,
    error_details: errorDetails,
  };

  try {
    await fetch(`${supabaseUrl}/rest/v1/notification_failures`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseServiceRoleKey,
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // Do not throw: notification endpoint should return its original error semantics.
  }
}

serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const incomingSecret = req.headers.get("x-webhook-secret") || "";
  if (!webhookSecret || incomingSecret !== webhookSecret) {
    return jsonResponse({ error: "Unauthorized webhook request" }, 401);
  }

  if (!resendApiKey || !notifyEmail) {
    return jsonResponse({ error: "Missing RESEND_API_KEY or TEAM_NOTIFY_EMAIL" }, 500);
  }

  try {
    const payload = await req.json();
    const record = payload?.record || {};

    const dogName = escapeHtml(record?.dog_name || "Unknown Dog");
    const userName = escapeHtml(record?.user_name || "Unknown User");
    const userEmail = escapeHtml(record?.user_email || "");
    const location = escapeHtml(record?.location || "");
    const story = escapeHtml(record?.story || "");
    const social = escapeHtml(record?.social_media || "");
    const id = escapeHtml(record?.id || "");

    const mediaList = Array.isArray(record?.media_urls)
      ? record.media_urls
          .map((m: { public_url?: string; file_name?: string }) => {
            const url = escapeHtml(m?.public_url || "");
            const name = escapeHtml(m?.file_name || "media");
            if (!url) return "";
            return `<li><a href=\"${url}\" target=\"_blank\" rel=\"noopener noreferrer\">${name}</a></li>`;
          })
          .join("")
      : "";

    const html = `
      <h2>New Dog Media Submission</h2>
      <p><strong>Submission ID:</strong> ${id}</p>
      <p><strong>Dog:</strong> ${dogName}</p>
      <p><strong>Submitted by:</strong> ${userName} (${userEmail})</p>
      <p><strong>Location:</strong> ${location}</p>
      ${social ? `<p><strong>Social:</strong> ${social}</p>` : ""}
      <p><strong>Story:</strong><br>${story}</p>
      ${mediaList ? `<p><strong>Media Links:</strong></p><ul>${mediaList}</ul>` : ""}
    `;

    const resendResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [notifyEmail],
        subject: `New Submission: ${record?.dog_name || "Dog"}`,
        html,
      }),
    });

    if (!resendResp.ok) {
      const errText = await resendResp.text();
      await logFailure(String(record?.id || ""), "Resend request failed", {
        status: resendResp.status,
        response: errText,
      });
      return jsonResponse({ error: "Resend request failed", details: errText }, 502);
    }

    return jsonResponse({ ok: true });
  } catch (error) {
    let submissionId = "";
    try {
      const fallbackPayload = await req.clone().json();
      submissionId = String(fallbackPayload?.record?.id || "");
    } catch {
      submissionId = "";
    }
    await logFailure(submissionId, "Failed to process webhook", {
      error: String(error),
    });
    return jsonResponse({ error: "Failed to process webhook", details: String(error) }, 500);
  }
});
