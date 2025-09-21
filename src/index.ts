import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  console.log(JSON.stringify(c.req, null, 2));
  return c.json({
    status: 200,
    message: "Hello From Bun Hono server",
  });
});

export default app;
