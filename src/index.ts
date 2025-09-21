import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.json({
    status: 200,
    message: "Hello From Bun Hono server",
  });
});

export default app;
