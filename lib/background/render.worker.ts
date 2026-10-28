import { renderHeavy } from "@/lib/background/heavy";
import { createRenderHandler, type RenderRequest, type RenderResponse } from "@/lib/background/render-protocol";

/** The worker's global scope, as much of it as this file uses. */
type Scope = {
  onmessage: ((event: MessageEvent<RenderRequest>) => void) | null;
  postMessage: (message: RenderResponse) => void;
};

const scope = self as unknown as Scope;
const handle = createRenderHandler(renderHeavy, (response) => scope.postMessage(response));
scope.onmessage = (event) => handle(event.data);
