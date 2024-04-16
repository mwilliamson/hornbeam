# Hornbeam

## Running the server

* Run `npm install`.
* Start the server with `npm start`.
* Run `npm run build` to build the client.

The server can be configured with the environment variables:

* `EVENT_LOG_PATH`: the path to which the events should be saved,
  allowing state to be persisted over server restarts.

* `PORT`: the port to run the server on. Defaults to 8080.

* `WEBSOCKET_PATH`: the path the server should accept client connections on.
  If set, add `path=$PATH` to the query string.

For instance, if you ran:

```
PORT=8000 WEBSOCKET_PATH=/example npm start
```

then you should be able to open the client with the URL:

```
http://localhost:8000/?path=/example
```

## Development

During development:

* Run `npm run build-watch` to continuously build the client.
* Run `npm run check-watch` to continuously type-check and lint the client.
