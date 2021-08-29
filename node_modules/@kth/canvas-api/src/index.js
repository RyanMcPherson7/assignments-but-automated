/* eslint-disable max-classes-per-file */
const got = require("got");
const queryString = require("query-string");
const { FormData, fileFromPath } = require("formdata-node");
const { Encoder } = require("form-data-encoder");
const fs = require("fs");
const { Readable } = require("stream");
const { augmentGenerator } = require("./utils");

class CanvasApiError extends Error {
  constructor(gotError) {
    super(gotError.message);
    this.name = gotError.name;
    this.options = {
      headers: gotError.options.headers,
      url: gotError.options.url.toString(),
    };
    this.options.headers.authorization = "[HIDDEN VALUE]";

    this.response = {
      body: gotError.response.body,
      headers: gotError.response.headers,
      ip: gotError.response.ip,
      retryCount: gotError.response.retryCount,
      statusCode: gotError.response.statusCode,
      statusMessage: gotError.response.statusMessage,
    };

    if (this.response.headers["content-type"]?.startsWith("text/html")) {
      this.response.body = this.response.body?.slice(0, 200);
    }
  }
}

function getNextUrl(linkHeader) {
  const next = linkHeader
    .split(",")
    .find((l) => l.search(/rel="next"$/) !== -1);

  const url = next && next.match(/<(.*?)>/);
  return url && url[1];
}

module.exports = class CanvasAPI {
  constructor(apiUrl, apiToken, options = {}) {
    this.gotClient = got.extend({
      prefixUrl: apiUrl,
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
      responseType: "json",
      ...options,
    });
  }

  async requestUrl(endpoint, method, body = {}, options = {}) {
    if (method === "GET") {
      throw new Error(
        "You cannot make a GET request with `requestUrl`. Use `get`, `list` or `listPaginated` instead"
      );
    }

    try {
      const result = await this.gotClient(endpoint, {
        method,
        json: body,
        ...options,
      });

      return result;
    } catch (err) {
      throw new CanvasApiError(err);
    }
  }

  async get(endpoint, queryParams = {}) {
    try {
      const result = await this.gotClient.get(endpoint, {
        searchParams: queryString.stringify(queryParams, {
          arrayFormat: "bracket",
        }),
      });

      return result;
    } catch (err) {
      throw new CanvasApiError(err);
    }
  }

  async *_listPaginated(endpoint, queryParams = {}, options = {}) {
    try {
      const first = await this.gotClient.get(endpoint, {
        searchParams: queryString.stringify(queryParams, {
          arrayFormat: "bracket",
        }),
        ...options,
      });

      yield first.body;
      let url =
        first.headers && first.headers.link && getNextUrl(first.headers.link);

      while (url) {
        // eslint-disable-next-line no-await-in-loop
        const response = await this.gotClient.get(url, {
          prefixUrl: "",
          ...options,
        });

        yield response.body;
        url =
          response.headers &&
          response.headers.link &&
          getNextUrl(response.headers.link);
      }
    } catch (err) {
      throw new CanvasApiError(err);
    }
  }

  async *_list(endpoint, queryParams = {}, options = {}) {
    for await (const page of this._listPaginated(
      endpoint,
      queryParams,
      options
    )) {
      if (!Array.isArray(page)) {
        throw new Error(
          `The function ".list()" should be used with endpoints that return arrays. Use "get()" or "listPaginated" instead with the endpoint ${endpoint}.`
        );
      }

      for (const element of page) {
        yield element;
      }
    }
  }

  async sendSis(endpoint, attachment, body = {}) {
    const fd = new FormData();

    // eslint-disable-next-line guard-for-in
    for (const key in body) {
      fd.set(key, body[key]);
    }

    await fs.promises.access(attachment);
    fd.set("attachment", await fileFromPath(attachment));

    const encoder = new Encoder(fd);

    return this.gotClient
      .post(endpoint, {
        body: Readable.from(encoder),
        headers: encoder.headers,
      })
      .then((response) => response);
  }

  listPaginated(endpoint, queryParams = {}, options = {}) {
    return augmentGenerator(
      this._listPaginated(endpoint, queryParams, options)
    );
  }

  list(endpoint, queryParams = {}, options = {}) {
    return augmentGenerator(this._list(endpoint, queryParams, options));
  }
};
