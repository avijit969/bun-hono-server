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

// Helper function: set correct Content-Type
function getContentType(path: string) {
  if (path.endsWith(".js") || path.endsWith(".mjs"))
    return "application/javascript";
  if (path.endsWith(".wasm")) return "application/wasm";
  if (path.endsWith(".css")) return "text/css";
  if (path.endsWith(".json")) return "application/json";
  if (path.endsWith(".html")) return "text/html";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  if (path.endsWith(".svg")) return "image/svg+xml";
  if (path.endsWith(".ico")) return "image/x-icon";
  if (path.endsWith(".ttf")) return "font/ttf";
  if (path.endsWith(".woff")) return "font/woff";
  if (path.endsWith(".woff2")) return "font/woff2";
  return "text/plain";
}

// Catch-all route
app.get("/*", async (c) => {
  try {
    // Remove leading slash from path
    let reqPath = c.req.param("*") || "index.html";
    reqPath = reqPath.replace(/^\/+/, "");

    // Extract project name from subdomain (e.g., avijit.signmate.site → avijit)
    const host = c.req.header("host") || "";
    const project = host.split(".")[0];

    console.log("Project:", project, "Requested Path:", reqPath);

    // Fetch requested file from R2
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
    console.warn(`R2 fetch error for ${c.req.param("*")}:`, err);

    // SPA fallback for HTML routes only
    const reqPath = c.req.param("*") || "index.html";
    if (!reqPath.includes(".") || reqPath.endsWith(".html")) {
      try {
        const host = c.req.header("host") || "";
        const project = host.split(".")[0];

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
        console.error("SPA fallback failed:", _);
      }
    }

    // File not found
    return new Response("Not Found", { status: 404 });
  }
});

export default app;
