import server from "../dist/server/server.js";

export default async function handler(req, res) {
  try {
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
    const fullUrl = `${protocol}://${host}${req.url}`;

    const headers = new Headers();
    for (const [key, val] of Object.entries(req.headers)) {
      if (val) {
        if (Array.isArray(val)) {
          val.forEach((v) => headers.append(key, v));
        } else {
          headers.set(key, val);
        }
      }
    }

    let body = null;
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method) && req.body) {
      body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    }

    const webReq = new Request(fullUrl, {
      method: req.method,
      headers,
      body,
    });

    const response = await server.fetch(webReq);

    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    res.end(buffer);
  } catch (err) {
    console.error("Vercel Serverless Error:", err);
    res.statusCode = 500;
    res.end("Internal Server Error: " + (err?.message || String(err)));
  }
}
