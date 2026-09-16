# Weather Integration Operations

Status: Implemented in T9; resource bounds added in T10 (SEC-100)

## Purpose

The weather integration gives a guest current conditions for the hotel city without making booking depend on an external service. Express owns the provider interaction and exposes one stable internal contract to React.

Open-Meteo is used for geocoding and current conditions. No API key is required for the selected non-commercial development interface. Provider terms and production suitability must be reviewed again before release.

## Request flow

1. `HotelPage` loads hotel and room data from the catalog APIs.
2. `WeatherSummary` independently requests `GET /api/weather?city=...`.
3. Express validates the city before making any external request.
4. The weather service geocodes the city with a one-result limit.
5. It requests temperature, apparent temperature, weather code, and wind speed for the resolved coordinates.
6. Zod validates both provider responses before mapping them to the internal contract.
7. React maps the numeric weather code to concise guest-facing text.

Weather is supplemental. A slow, unavailable, unknown, or malformed provider response changes only the weather panel. It does not affect hotel details, room availability, prices, or booking.

## Configuration

| Variable                       | Default                                          | Allowed range        |
| ------------------------------ | ------------------------------------------------ | -------------------- |
| `WEATHER_TIMEOUT_MS`           | `4000`                                           | 250 through 15000 ms |
| `WEATHER_CACHE_TTL_MS`         | `600000`                                         | 1000 through 3600000 |
| `WEATHER_MAX_IN_FLIGHT`        | `4`                                              | 1 through 64         |
| `WEATHER_MAX_CACHE_ENTRIES`    | `500`                                            | 1 through 100000     |
| `WEATHER_RATE_LIMIT_WINDOW_MS` | `60000`                                          | 1000 through 3600000 |
| `WEATHER_RATE_LIMIT_MAX`       | `60`                                             | 1 through 10000      |
| `WEATHER_GEOCODING_URL`        | `https://geocoding-api.open-meteo.com/v1/search` | Valid URL            |
| `WEATHER_FORECAST_URL`         | `https://api.open-meteo.com/v1/forecast`         | Valid URL            |

The URL overrides support controlled test environments and provider migrations. They are backend-only settings and must never use a `VITE_` prefix.

## Reliability boundaries

- Each provider request has its own abort deadline.
- The public route is rate limited per client by `WEATHER_RATE_LIMIT_WINDOW_MS` and `WEATHER_RATE_LIMIT_MAX`. Requests over the limit return HTTP 429 `RATE_LIMITED` before any provider work.
- Successful values are cached by trimmed, case-normalized city.
- Simultaneous requests for the same city share one in-flight promise.
- Distinct city lookups pass through a shared concurrency limit of `WEATHER_MAX_IN_FLIGHT`, so a burst of different cities cannot start unlimited simultaneous provider calls.
- The success cache holds at most `WEATHER_MAX_CACHE_ENTRIES`. Expired entries are dropped and the oldest entry is evicted first, so the cache cannot grow without bound.
- Provider and parsing failures are never cached.
- The cache is process-local and intentionally non-authoritative.
- Multiple Render instances may perform separate lookups, which is acceptable for supplemental weather.
- API error responses contain a stable code, safe message, and request identifier, not the provider body.

## Verification

Run focused backend behavior tests:

```powershell
npm --workspace backend test -- weather
```

Run frontend behavior tests, including weather success and graceful failure:

```powershell
npm --workspace frontend test -- customer
```

Run the complete current gate:

```powershell
npm run verify:local
```

## Troubleshooting

- HTTP 400 means the city query did not satisfy the internal request contract.
- HTTP 404 means geocoding found no matching location. Hotel and room data remain available.
- HTTP 503 with `WEATHER_UPSTREAM_TIMEOUT` means the provider exceeded the configured deadline.
- Other HTTP 503 weather codes indicate provider availability or response-shape failure.
- Repeated external calls during local development are expected after the cache lifetime or process restart.
- Never increase the timeout enough to make the supplemental panel delay operational requests. The browser request is isolated, but long-lived server work still consumes resources.
