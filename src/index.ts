import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Hono } from "hono";

const app = new Hono();

// Initialize R2 client
const s3 = new S3Client({
  region: "auto",
  forcePathStyle: true,
  endpoint: "https://5d705b266cd8845b315556f319e99893.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: "2e3b18725fda11bcd53ea09e80f78819",
    secretAccessKey:
      "993ef055b6f6ec5da099419e9b4dbd51cb0704b81cd0523b254c0f1eadb767db",
  },
});

// Detect content type manually
function getContentType(path: string) {
  if (path.endsWith(".js") || path.endsWith(".mjs"))
    return "application/javascript";
  if (path.endsWith(".css")) return "text/css";
  if (path.endsWith(".html")) return "text/html";
  if (path.endsWith(".json")) return "application/json";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  if (path.endsWith(".svg")) return "image/svg+xml";
  if (path.endsWith(".wasm")) return "application/wasm";
  return "text/plain";
}

app.get("/*", async (c) => {
  const host = c.req.header("host") || "";
  const project = host.split(".")[0]; // subdomain → project

  let reqPath = c.req.param("*") || "index.html";
  reqPath = reqPath.replace(/^\/+/, "");

  console.log("Project:", project, "Requested Path:", reqPath);

  try {
    // Fetch asset from R2
    const result = await s3.send(
      new GetObjectCommand({
        Bucket: "dist",
        Key: `${project}/${reqPath}`,
      })
    );

    return new Response(result.Body as ReadableStream, {
      headers: {
        "Content-Type": result.ContentType || getContentType(reqPath),
      },
      status: result.$metadata.httpStatusCode,
    });
  } catch (err) {
    console.warn("Asset not found in R2:", reqPath);

    // Only fallback to index.html if it's a route (no extension)
    if (!reqPath.includes(".")) {
      try {
        const fallback = await s3.send(
          new GetObjectCommand({
            Bucket: "dist",
            Key: `${project}/index.html`,
          })
        );

        return new Response(fallback.Body as ReadableStream, {
          headers: { "Content-Type": "text/html" },
          status: 200,
        });
      } catch (_) {
        return new Response("Not Found", { status: 404 });
      }
    }

    // For JS/CSS/images → return 404 (don’t return HTML)
    return new Response("Not Found", { status: 404 });
  }
});

export default {
  port: 80,
  fetch: app.fetch,
};
