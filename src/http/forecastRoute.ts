import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { CashFlowForecastEngine } from "../domain/forecast/CashFlowForecastEngine.js";
import type { ForecastDataProvider } from "../ports/forecastData.js";

export function createForecastServer(provider: ForecastDataProvider, engine = new CashFlowForecastEngine()) {
  return createServer((request, response) => handleForecastRequest(request, response, provider, engine));
}

export function handleForecastRequest(request: IncomingMessage, response: ServerResponse, provider: ForecastDataProvider, engine: CashFlowForecastEngine): void {
  const url = new URL(request.url ?? "/", "http://localhost");
  if (request.method !== "GET" || url.pathname !== "/v2/cash-flow/forecast") {
    writeJson(response, 404, { error: "Not found" });
    return;
  }
  try {
    const days = Number(url.searchParams.get("days") ?? "14");
    const result = engine.calculate({
      storeId: "carmen-limpia-ya", // Fixture-backed context; production auth is intentionally out of scope.
      asOfDate: url.searchParams.get("asOfDate") ?? "2027-01-25",
      days,
      timezone: "America/Bogota"
    }, provider.getForecastData("carmen-limpia-ya"));
    writeJson(response, 200, result);
  } catch (error) {
    writeJson(response, 400, { error: error instanceof Error ? error.message : "Invalid forecast request" });
  }
}

function writeJson(response: ServerResponse, statusCode: number, body: unknown): void {
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}
