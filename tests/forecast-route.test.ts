import { describe, expect, it } from "vitest";
import { CarmenFixtureProvider } from "../src/adapters/fixtures/carmenLimpiaYa.js";
import { createForecastServer } from "../src/http/forecastRoute.js";

describe("forecast HTTP endpoint", () => {
  it("returns the engine result shape", async () => {
    const server = createForecastServer(new CarmenFixtureProvider());
    await new Promise<void>(resolve => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("server did not bind");
    try {
      const response = await fetch(`http://127.0.0.1:${address.port}/v2/cash-flow/forecast?days=14`);
      const body = await response.json() as Record<string, unknown>;
      expect(response.status).toBe(200);
      expect(body.period).toMatchObject({ days: 14, currency: "COP" });
      expect(body).toHaveProperty("scenarios.expected");
      expect(body).toHaveProperty("confidence.score");
      expect(body).toHaveProperty("actions.collections");
    } finally {
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });
});
