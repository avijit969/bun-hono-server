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
  const reqPath = c.req.path === "/resolve" ? "index.html" : c.req.path;
  console.log(project, commit, reqPath);
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
  } catch (error) {
    console.log(error);
    return c.json({
      status: 404,
      message: "Not Found",
    });
  }
});
export default app;
