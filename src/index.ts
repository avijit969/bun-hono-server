import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Hono } from "hono";

const app = new Hono();

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

app.get("/*", async (c) => {
  // full path after '/'
  const reqPath = c.req.param("*") || "index.html"; // default to index.html

  // extract project from host subdomain
  const host = c.req.header("host") || "";
  const project = host.split(".")[0]; // "avijit" from "avijit.signmate.site"

  console.log("Project:", project, "Path:", reqPath);

  try {
    const result = await s3.send(
      new GetObjectCommand({
        Bucket: "dist",
        Key: `${project}/${reqPath}`,
      })
    );

    return new Response(result.Body as ReadableStream, {
      headers: {
        "Content-Type": result.ContentType || "text/plain",
      },
      status: result.$metadata.httpStatusCode,
    });
  } catch (error: any) {
    console.error("R2 Fetch Error:", error);

    // SPA fallback: return index.html if not found
    if (reqPath !== "index.html") {
      try {
        const fallback = await s3.send(
          new GetObjectCommand({
            Bucket: "dist",
            Key: `${project}/index.html`,
          })
        );
        return new Response(fallback.Body as ReadableStream, {
          headers: {
            "Content-Type": fallback.ContentType || "text/html",
          },
          status: 200,
        });
      } catch (_) {}
    }

    return c.json({
      status: 404,
      message: "Not Found",
    });
  }
});

export default app;
