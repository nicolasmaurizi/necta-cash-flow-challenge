import { CarmenFixtureProvider } from "./adapters/fixtures/carmenLimpiaYa.js";
import { createForecastServer } from "./http/forecastRoute.js";

const port = Number(process.env.PORT ?? 3000);
createForecastServer(new CarmenFixtureProvider()).listen(port, () => {
  console.log(`Cash-flow forecast API listening on http://localhost:${port}`);
});
