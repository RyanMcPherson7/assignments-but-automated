const { expect, test } = require("@jest/globals");
const createTestServer = require("create-test-server");
const fs = require("fs");
const tempy = require("tempy");

const Canvas = require(".");

test("Token is correctly stripped", async () => {
  const canvas = new Canvas(
    "https://kth.test.instructure.com/api/v1",
    "My token"
  );

  try {
    await canvas.get("/accounts");
  } catch (err) {
    const error = JSON.stringify(err);
    expect(error).not.toMatch(/My token/);
  }
});

test('URLs are correctly "resolved"', async () => {
  const server = await createTestServer();
  server.get("/index", { foo: "bar" });
  server.get("/api/v1/courses/1", { foo: "bar" });

  {
    const canvas = new Canvas(server.url, "");
    const result = await canvas.get("index");
    expect(result.body.foo).toBe("bar");
  }
  {
    const canvas = new Canvas(server.url + "/", "");
    const result = await canvas.get("index");
    expect(result.body.foo).toBe("bar");
  }
  {
    const canvas = new Canvas(`${server.url}/api/v1`, "");
    const result = await canvas.get("courses/1");
    expect(result.body.foo).toBe("bar");
  }

  await server.close();
});

test("List returns a correct iterable", async () => {
  const server = await createTestServer();

  server.get("/something", (req, res) => {
    res.set(
      "Link",
      `<${server.url}/something_else>; rel="next", <irrelevant>; rel="first"`
    );
    res.send([1, 2, 3]);
  });
  server.get("/something_else", [4, 5]);

  const canvas = new Canvas(server.url, "");
  const result = [];

  for await (const e of canvas.list("something")) {
    result.push(e);
  }

  expect(result).toEqual([1, 2, 3, 4, 5]);

  await server.close();
});

test("List returns an Augmented iterable", async () => {
  const server = await createTestServer();

  server.get("/something", (req, res) => {
    res.set(
      "Link",
      `<${server.url}/something_else>; rel="next", <irrelevant>; rel="first"`
    );
    res.send([1, 2, 3]);
  });
  server.get("/something_else", [4, 5]);

  const canvas = new Canvas(server.url, "");
  const result = await canvas.list("something").toArray();

  expect(result).toEqual([1, 2, 3, 4, 5]);

  await server.close();
});

test('List ignores non-"rel=next" link headers', async () => {
  const server = await createTestServer();

  server.get("/something", (req, res) => {
    res.set(
      "Link",
      '<http://dont-call.com>; rel="last", <http://ignore-this.se>; rel="prev", <http://nope.com>; rel="first"'
    );
    res.send([1]);
  });

  const canvas = new Canvas(server.url, "");
  const result = [];

  for await (const e of canvas.list("something")) {
    result.push(e);
  }
  expect(result).toEqual([1]);

  await server.close();
});

test("List can handle pagination urls with query strings", async () => {
  const server = await createTestServer();

  server.get("/something", (req, res) => {
    res.set("Link", `<${server.url}/something_else?query=string>; rel="next"`);
    res.send([1]);
  });
  server.get("/something_else", (req, res) => {
    if (req.originalUrl === "/something_else?query=string") {
      res.send(["correct"]);
    } else {
      res.send(["nope"]);
    }
  });

  const canvas = new Canvas(server.url, "");

  const it = canvas.list("something?with=query_string");
  await it.next();
  const result = await it.next();
  expect(result.value).toBe("correct");

  await server.close();
});

test("requestUrl parses the `body` as JSON automatically", async () => {
  const server = await createTestServer();

  server.post("/endpoint", (req, res) => {
    res.send(req.body);
  });

  const canvas = new Canvas(server.url, "");

  const { body } = await canvas.requestUrl("endpoint", "POST", { foo: "bar" });
  expect(body).toEqual({ foo: "bar" });

  await server.close();
});

test("sendSis fails when file is missing", async () => {
  const canvas = new Canvas("https://example.instructure.com", "Token");

  try {
    await canvas.sendSis("some-endpoint", "non-existing-file");
  } catch (err) {
    expect(err).toMatchInlineSnapshot(
      `[Error: ENOENT: no such file or directory, access 'non-existing-file']`
    );
  }
});

test("sendSis returns a parsed JSON object upon success", async () => {
  const server = await createTestServer();

  server.post("/file", (req, res) => {
    res.send({ key: "value" });
  });

  const canvas = new Canvas(server.url, "");
  const tmp = tempy.file();
  fs.writeFileSync(tmp, "hello world");
  const response = await canvas.sendSis("file", tmp);
  expect(response.body).toEqual({ key: "value" });

  await server.close();
});

test("sendSis throws an error if timeout is over", async () => {
  const server = await createTestServer();

  server.post("/file", (req, res) => {
    setTimeout(() => {
      res.send({ key: "value" });
    }, 2000);
  });

  const canvas = new Canvas(server.url, "", { timeout: 1 });
  const tmp = tempy.file();
  fs.writeFileSync(tmp, "hello world");

  try {
    await canvas.sendSis("file", tmp);
  } catch (err) {
    expect(err).toMatchInlineSnapshot(
      `[TimeoutError: Timeout awaiting 'request' for 1ms]`
    );
  } finally {
    await server.close();
  }
});

test("List throws an error if the endpoint response is not an array", async () => {
  const server = await createTestServer();

  server.get("/not-a-list", (req, res) => {
    res.send({ x: 1 });
  });

  const canvas = new Canvas(server.url, "");
  const it = canvas.list("not-a-list");

  await expect(() => it.next()).rejects.toThrowErrorMatchingInlineSnapshot(
    `"The function \\".list()\\" should be used with endpoints that return arrays. Use \\"get()\\" or \\"listPaginated\\" instead with the endpoint not-a-list."`
  );

  await server.close();
});
