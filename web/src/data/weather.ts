// Battle weather (The Glory's forecaster boss cycles it each turn; other fights may set one).
export type WeatherId = "clear" | "rain" | "snow" | "wind" | "heatwave";

export interface Weather {
  id: WeatherId;
  name: string;
  attackScale: number;
  magicScale: number;
  speedScale: number;
  line: string;
}

export const WEATHER: Record<WeatherId, Weather> = {
  clear: { id: "clear", name: "Clear", attackScale: 1, magicScale: 1, speedScale: 1, line: "Clear skies." },
  rain: {
    id: "rain",
    name: "Rain",
    attackScale: 0.85,
    magicScale: 1.25,
    speedScale: 1,
    line: "Rain. Umbrellas up.",
  },
  snow: {
    id: "snow",
    name: "Snow",
    attackScale: 1,
    magicScale: 1,
    speedScale: 0.7,
    line: "Snow. Everyone slows down.",
  },
  wind: {
    id: "wind",
    name: "Wind",
    attackScale: 1,
    magicScale: 1,
    speedScale: 1.3,
    line: "Wind. Hair everywhere.",
  },
  heatwave: {
    id: "heatwave",
    name: "Heatwave",
    attackScale: 1.3,
    magicScale: 0.8,
    speedScale: 1,
    line: "Heatwave. Tempers rise.",
  },
};

export const FORECAST_CYCLE: readonly WeatherId[] = ["rain", "wind", "snow", "heatwave", "clear"];
