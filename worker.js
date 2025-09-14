export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    try {
      // --- handle form posts ---
      if (request.method === "POST" && url.pathname === "/contact") {
        // parse form fields (works with HTML form POST)
        const fd = await request.formData()
        const name = (fd.get("name") || "").toString().trim()
        const email = (fd.get("email") || "").toString().trim()
        const message = (fd.get("message") || "").toString().trim()

        // basic validation
        if (!name || !email || !message) {
          return new Response("Missing fields", { status: 400 })
        }

        // Build payload for Zapier
        const payload = { name, email, message, site: "ai-engines.ai", ts: Date.now() }

        // Forward to Zapier webhook
        const webhook = env.ZAPIER_WEBHOOK
        if (!webhook) return new Response("Webhook not configured", { status: 500 })

        const zapResp = await fetch(webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        // Optionally save to KV for archival
        try {
          if (env.AI_ENGINES_WEB) {
            const key = `form:${Date.now()}`
            await env.AI_ENGINES_WEB.put(key, JSON.stringify(payload))
          }
        } catch (e) {
          // non-fatal: we still want zap/email to happen
          console.warn("KV put failed", e)
        }

        // If Zapier returned 2xx, redirect to thank-you page (303)
        if (zapResp.ok) {
          return Response.redirect("/thank-you.html", 303)
        } else {
          return new Response("Failed to forward form", { status: 502 })
        }
      }

      // --- static file serving (your existing KV logic) ---
      const path = url.pathname === "/" ? "/index.html" : url.pathname
      const file = await env.AI_ENGINES_WEB.get(path, { type: "stream" })
      if (!file) return new Response("Not found", { status: 404 })
      return new Response(file, { headers: { "Content-Type": contentType(path) } })
    } catch (err) {
      return new Response(`Worker error: ${err.message}`, { status: 500 })
    }
  }
}

function contentType(path) {
  if (path.endsWith(".html")) return "text/html; charset=UTF-8"
  if (path.endsWith(".css")) return "text/css"
  if (path.endsWith(".js")) return "application/javascript"
  if (path.endsWith(".png")) return "image/png"
  if (path.endsWith(".jpg")||path.endsWith(".jpeg")) return "image/jpeg"
  if (path.endsWith(".svg")) return "image/svg+xml"
  return "application/octet-stream"
}
