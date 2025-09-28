export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    // Only handle POSTs to /contact
    if (request.method === "POST" && url.pathname === "/contact") {
      const fd = await request.formData()

      // Grab fields from the form
      const payload = {
        name: (fd.get("name") || "").trim(),
        last_name: (fd.get("last_name") || "").trim(),
        email: (fd.get("email") || "").trim(),
        phone: (fd.get("phone") || "").trim(),
        company: (fd.get("company") || "").trim(),
        message: (fd.get("message") || "").trim(),
        site: "ai-engines.ai",
        ts: Date.now()
      }

      // Basic validation
      if (!payload.name || !payload.email || !payload.message) {
        return new Response("Missing required fields", { status: 400 })
      }

      // Send to Zapier webhook
      const webhook = env.ZAPIER_WEBHOOK
      if (!webhook) {
        return new Response("Webhook not configured", { status: 500 })
      }

      const zapResp = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (zapResp.ok) {
        // Redirect to your thank-you page
        return Response.redirect(`${url.origin}/thank-you.html`, 303)
      } else {
        return new Response("Failed to forward form", { status: 502 })
      }
    }

    // Fallback for other routes
    return new Response("Not found", { status: 404 })
  }
}

