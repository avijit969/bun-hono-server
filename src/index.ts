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

app.get("*", async (c) => {
  const host = c.req.header("Host") || "";
  console.log("host: ", host);
  const subdomain = host.replace(`.${process.env.ROOT_DOMAIN}`, "");

  const reqPath = c.req.path === "/" ? "/index.html" : c.req.path;
  const key = `${subdomain}${reqPath}`;

  console.log(`Serving ${key}\nsubdomain: ${subdomain}\nreqPath: ${reqPath}`);
  console.log("key: ", key);
  try {
    const result = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
      })
    );

    return new Response(result.Body as ReadableStream, {
      headers: {
        "Content-Type": result.ContentType || "text/html",
      },
    });
  } catch (err) {
    return c.text("Not Found", 404);
  }
});

export default {
  port: 80,
  fetch: app.fetch,
};
