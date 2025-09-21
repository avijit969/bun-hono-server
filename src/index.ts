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

app.get("/", (c) => {
  console.log(JSON.stringify(c.req, null, 2));
  return c.json({
    status: 200,
    message: "Hello From Bun Hono server",
  });
});

app.get("/resolve", async (c) => {
  const project = c.req.query("project");
  const commit = c.req.query("commit");
  const reqPath = c.req.path === "/" ? "/index.html" : c.req.path;
  console.log(project, commit, reqPath);
  try {
    const result = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: `${project}/${reqPath}`,
      })
    );
    return new Response(result.Body as ReadableStream, {
      headers: {
        "Content-Type": result.ContentType || "text/plain",
      },
      status: result.$metadata.httpStatusCode,
    });
  } catch (error) {
    console.log(error);
    return c.json({
      status: 404,
      message: "Not Found",
    });
  }
});
export default app;
