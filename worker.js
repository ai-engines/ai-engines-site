export default {
  async fetch(request) {
    return new Response(`<!DOCTYPE html>
<html>
<head><title>My Site</title></head>
<body>
<h1>Hello from Cloudflare Worker!</h1>
</body>
</html>`, {
      headers: { "Content-Type": "text/html;charset=UTF-8" },
    })
  }
}

