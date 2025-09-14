export default {
  async fetch(request, env) {
    try {
      let url = new URL(request.url)
      let path = url.pathname === "/" ? "/index.html" : url.pathname

      if (!env.MY_KV) {
        return new Response(
          "KV binding MY_KV not configured in wrangler.toml",
          { status: 500 }
        )
      }

      let file = await env.MY_KV.get(path, { type: "stream" })

      if (!file) {
        return new Response("Not found", { status: 404 })
      }

      return new Response(file, {
        headers: { "Content-Type": contentType(path) }
      })
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

