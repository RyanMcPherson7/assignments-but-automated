# Canvas API client

Node.JS HTTP client based on [got](https://github.com/sindresorhus/got) for the [Canvas LMS API](https://canvas.instructure.com/doc/api/)

[![Build Status](https://travis-ci.org/KTH/canvas-api.svg?branch=master)](https://travis-ci.org/KTH/canvas-api)

1. [Install](#install)
2. [Usage](#usage)
3. [API reference](docs/API.md)

## Install

```shell
npm i @kth/canvas-api
```

## Usage

```js
import CanvasApi from "@kth/canvas-api";
// or, with CommonJS:
// const CanvasApi = require("@kth/canvas-api");

async function start() {
  const canvas = new CanvasApi(
    "https://kth.instructure.com/api/v1",
    "XXXX~xxxx"
  );
  const { body } = await canvas.get("/accounts/1");
}

start();
```

## Examples

### Create a course

```js
import CanvasApi from "@kth/canvas-api";
const canvas = new CanvasApi("https://kth.instructure.com/api/v1", "XXXX~xxxx");

async function start() {
  const { body } = await canvas.requestUrl("/accounts/1/courses", "POST");
  console.log(`Created! https://kth.test.instructure.com/courses/${body.id}`);
}
start();
```

→ [See the full API here](docs/API.md)

## Array vs iterable

### Array example. Get a list of integration IDs of sections within a course

It is easier to use an array if you want to use JavaScript array methods (map, filter, etc.), when you want to retrieve the entire collection or when you know that the collection has a small size.

```js
import CanvasApi from "@kth/canvas-api";

const courseId = "XXXX";
const canvas = new CanvasApi("https://kth.instructure.com/api/v1", "XXXX~xxxx");

async function start() {
  const sections = (
    await canvas.list(`/courses/${courseId}/sections`).toArray()
  ).map((section) => section.integration_id);

  console.log(sections);
}
start();
```

### Iterable example. Get 5 courses that contain the word "sustain" in their name

It is better to use an iterable if you don't want to fetch all the resources in a collection (in this case we are interested in **5 courses that...**)

```js
import CanvasApi from "@kth/canvas-api";
const canvas = new CanvasApi("https://kth.instructure.com/api/v1", "XXXX~xxxx");

function isSustainable(course) {
  return course.name.toLowerCase().indexOf("sustain") !== -1;
}

async function start() {
  const courses = canvas.list("/accounts/1/courses");
  const result = [];

  for await (const course of courses) {
    if (isSustainable(course)) {
      result.push(course.name);
    }

    if (result.length >= 5) {
      break;
    }
  }

  console.log(result);
}
start();
```
