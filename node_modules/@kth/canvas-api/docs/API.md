# API reference

Global functions

- [**CanvasApi(url, token)**](#global-CanvasApi). Creates and returns a CanvasAPI instance.

CanvasAPI instance methods:

- [**get(endpoint, queryParams)**](#CanvasApi-get) : Promise

  Perform a GET request to the `endpoint`

- [**list(endpoint, queryParams)**](#CanvasApi-list) : ExtendedAsyncIterator

  Returns an iterable of elements returned by `endpoint` and its following pages.

- [**listPaginated(endpoint, queryParams)**](#CanvasApi-listPaginated) : ExtendedAsyncIterator

  Returns an iterable of pages (list of elements) returned by `endpoint` and its following pages.

- [**sendSis(endpoint, attachment, body)**](#CanvasApi-sendSis) : Promise

  Perform a POST request to the `endpoint` including the `attachment` as attachment

- [**requestUrl(endpoint, method, body, options)**](#CanvasApi-requestUrl) : Promise

  Perform non-GET requests to the `endpoint`

# Global functions

<a href="" id="global-CanvasApi"></a>

## CanvasApi(url, token)

Creates and returns a Canvas API instance. Arguments:

- `url`. Canvas API root URL. For example: `https://kth.test.instructure.com/api/v1`
- `token`. Canvas API user token. Can be generated manually or via Oauth. [Read more in the Canvas API documentation](https://canvas.instructure.com/doc/api/file.oauth.html#accessing-canvas-api)

```js
const canvas = Canvas("https://xxx.instructure.com/api/v1", "AAAA~XXX");
```

# CanvasAPI instance methods

<a href="" id="CanvasApi-get"></a>

## get(endpoint, queryParams = {})

Perform a GET request to the `endpoint`. Arguments:

- `endpoint`. Endpoint to perform the request. For example `/accounts/1`
- `queryParams` (optional). Query parmeters passed as plain object. They will be converted using the [query-string](https://github.com/sindresorhus/query-string) package.

Returns a promise of an object with the response of the API operation including the properties `body`, `headers` and `statusCode`

```js
const { body, headers, statusCode } = await canvas.get("/accounts/1");
```

<a href="" id="CanvasApi-list"></a>

## list(endpoint, queryParams = {})

Perform a GET request to the `endpoint` and to the following pages. Returns an iterable of the elements in the collection. Arguments:

- `endpoint`. Endpoint to perform the request. For example `/courses/`.
- `queryParams` (optional). Query parmeters passed as plain object. They will be converted using the [query-string](https://github.com/sindresorhus/query-string) package.

Returns an asynchronous iterable:

```js
const courses = canvas.list("/courses");
for await (let course of courses) {
  //...
}
```

You can easily convert the iterable to an array with the `toArray()` method:

```js
const courses = await canvas.list("/courses").toArray();
```

#### Notes

Calling `list` with an `endpoint` that does not return a collection will throw an Error.

<a href="" id="CanvasApi-listPaginated"></a>

## listPaginated(endpoint, queryParams = {})

Perform a GET request to the `endpoint` and to the following pages. Returns an iterable of the pages in the collection. Every page is a collection of elements. Arguments:

- `endpoint`. Endpoint to perform the request. For example `/courses/`.
- `queryParams` (optional). Query parmeters passed as plain object. They will be converted using the [query-string](https://github.com/sindresorhus/query-string) package.

Returns an asynchronous iterable:

```js
const courses = canvas.listPaginated("/courses");
for await (let page of courses) {
  //...
}
```

You can easily convert the iterable to an array with the `toArray()` method:

```js
const pages = await canvas.list("/courses").toArray();
```

<a href="" id="CanvasApi-sendSis"></a>

## sendSis(endpoint, attachment, body = {})

Perform a POST request to the `endpoint` including one `attachment` as attachment. Arguments:

- `endpoint`. Endpoint to perform the request. For example `/accounts/1/sis_imports`
- `attachment`. Path to the file to add as attachment.
- `body` (optional). Extra parameters to be sent in the request. Note: `attachment` is not a valid key for this argument.

<a href="" id="CanvasApi-requestUrl"></a>

## requestUrl(endpoint, method, body = {}, options = {})

Perform a non-GET (i.e. POST, PUT, DELETE, etc.) request to the `endpoint`. Arguments:

- `endpoint`. Endpoint to perform the request. For example `/accounts`
- `method`. HTTP method. For example `POST`
- `body` (optional). Body parameters of the request

Returns a promise of an object with the response of the API operation including the properties `body`, `headers` and `statusCode`

```js
const { body, headers, statusCode } = await canvas.post("/accounts", "POST");
```
