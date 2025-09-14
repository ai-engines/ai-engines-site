export default {
  async fetch(request, env) {
    let url = new URL(request.url)
    let path = url.pathname === "/" ? "/index.html" : url.pathname
    let file = await env.MY_KV.get(path, { type: "stream" })

    if (!file) {
      return new Response("Not found", { status: 404 })
    }

    return new Response(file, {
      headers: { "Content-Type": contentType(path) }
    })
  }
}

function contentType(path) {
  if (path.endsWith(".html")) return "text/html"
  if (path.endsWith(".css")) return "text/css"
  if (path.endsWith(".js")) return "application/javascript"
  if (path.endsWith(".png")) return "image/png"
  return "application/octet-stream"
}

