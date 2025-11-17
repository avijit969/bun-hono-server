import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Hono } from "hono";

const app = new Hono();

const s3 = new S3Client({
  region: "auto",
  forcePathStyle: true,
  endpoint: process.env.R2_ENDPOINT || "",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
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
