const appId = process.env.ONESIGNAL_APP_ID;
const apiKey = process.env.ONESIGNAL_APP_API_KEY;

if (!appId || !apiKey) throw new Error("OneSignal credentials are not available to the provider probe.");

const sendAfter = new Date(Date.now() + 10 * 60_000).toISOString();
const response = await fetch("https://api.onesignal.com/notifications", {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Key ${apiKey}` },
  body: JSON.stringify({
    app_id: appId,
    include_aliases: { external_id: ["1"] },
    target_channel: "push",
    headings: { en: "JAMB Quest: provider queue probe" },
    contents: { en: "Validation-only future-message probe. It will be cancelled immediately if accepted." },
    url: "/?tab=profile",
    send_after: sendAfter,
  }),
});

const raw = await response.text();
let parsed: unknown = raw;
try { parsed = JSON.parse(raw); } catch { /* Retain a non-secret plain-text provider error. */ }
console.log(JSON.stringify({ status: response.status, ok: response.ok, body: parsed }, null, 2));
