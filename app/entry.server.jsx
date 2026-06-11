import { renderToReadableStream } from "react-dom/server";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";
import { PassThrough } from "node:stream";

export const streamTimeout = 5000;

export default async function handleRequest(
  request,
  responseStatusCode,
  responseHeaders,
  routerContext,
) {
  let didError = false;
  const userAgent = request.headers.get("user-agent");
  const callbackName = isbot(userAgent ?? "") ? "onAllReady" : "onShellReady";

  const stream = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      [callbackName]() {
        shellReady = true;
      },
      onShellError(error) {
        didError = true;
        console.error(error);
      },
      onError(error) {
        didError = true;
        console.error(error);
      },
    },
  );

  await new Promise((resolve, reject) => {
    setTimeout(resolve, streamTimeout);
    stream.on("error", reject);
  });

  responseHeaders.set("Content-Type", "text/html");
  return new Response(stream, {
    status: didError ? 500 : responseStatusCode,
    headers: responseHeaders,
  });
}
