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

// Utility to get Content-Type from file extension
function getContentType(path: string) {
  if (path.endsWith(".js")) return "application/javascript";
  if (path.endsWith(".mjs")) return "application/javascript";
  if (path.endsWith(".css")) return "text/css";
  if (path.endsWith(".json")) return "application/json";
  if (path.endsWith(".wasm")) return "application/wasm";
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
  const reqPath = c.req.param("*") || "index.html";

  // Get project name from subdomain (avijit.signmate.site → avijit)
  const host = c.req.header("host") || "";
  const project = host.split(".")[0];

  console.log("Project:", project, "Requested Path:", reqPath);

  try {
    // Try to fetch requested file from R2
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
  } catch (error: any) {
    console.warn(`R2 Fetch Error for ${reqPath}:`, error);

    // SPA fallback only for non-asset paths
    if (!reqPath.includes(".") || reqPath.endsWith(".html")) {
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
        console.error("SPA fallback failed:", _);
      }
    }

    // Not found
    return c.json({ status: 404, message: "Not Found" }, 404);
  }
});

export default app;
