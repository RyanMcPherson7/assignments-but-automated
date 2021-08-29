const { test, expect } = require("@jest/globals");
const { augmentGenerator } = require("./utils");

test("augmentGenerator does not mutate the original generator", () => {
  async function* gen() {
    yield 1;
  }

  augmentGenerator(gen());

  expect(gen().toArray).toBeFalsy();
});

test("augmentGenerator returns a valid generator", async () => {
  async function* gen() {
    yield 1;
  }

  const g2 = augmentGenerator(gen());

  for await (const v of g2) {
    expect(v).toBe(1);
  }
});

test("AugmentedIterator.toArray works without arguments", async () => {
  async function* gen() {
    yield 1;
    yield 2;
    yield 3;
  }
  const gen2 = augmentGenerator(gen());

  expect(gen2.toArray()).resolves.toEqual([1, 2, 3]);
});

test("AugmentedIterator.toArray does not restart the iteration", async () => {
  async function* gen() {
    yield 1;
    yield 2;
    yield 3;
  }
  const gen2 = augmentGenerator(gen());

  await gen2.next();
  expect(gen2.toArray()).resolves.toEqual([2, 3]);
});
