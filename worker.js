export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    try {
      // --- handle form POSTs ---
      if (request.method === "POST" && url.pathname === "/contact") {
        const fd = await request.formData()
        const name = (fd.get("name") || "").toString().trim()
        const email = (fd.get("email") || "").toString().trim()
        const message = (fd.get("message") || "").toString().trim()

        if (!name || !email || !message) {
          return new Response("Missing fields", { status: 400 })
        }

        const payload = { name, email, message, site: "ai-engines.ai", ts: Date.now() }
        const webhook = env.ZAPIER_WEBHOOK
        if (!webhook) return new Response("Webhook not configured", { status: 500 })

        const zapResp = await fetch(webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        // Optional: save to KV
        try {
          if (env.AI_ENGINES_WEB) {
            const key = `form:${Date.now()}`
            await env.AI_ENGINES_WEB.put(key, JSON.stringify(payload))
          }
        } catch (e) {
          console.warn("KV put failed", e)
        }

        // Redirect to absolute thank-you page
        if (zapResp.ok) {
          return Response.redirect(`${url.origin}/thank-you.html`, 303)
        } else {
          return new Response("Failed to forward form", { status: 502 })
        }
      }

      // --- static file serving ---
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
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg"
  if (path.endsWith(".svg")) return "image/svg+xml"
  return "application/octet-stream"
}
