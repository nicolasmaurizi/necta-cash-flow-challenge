import type { ForecastData } from "../domain/forecast/types.js";

export interface ForecastDataProvider {
  getForecastData(storeId: string): ForecastData;
}
