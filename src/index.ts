import { Hono } from "hono";

const app = new Hono();

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
  return c.json({
    project,
    commit,
  });
});
export default app;
