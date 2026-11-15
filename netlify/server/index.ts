import { Hono } from "hono";
import { SUPPORTED_COINS, VALID_RANGES } from "../../server/config.ts";
import { getCoinHistoricalData, getMarketOverview, getUsdToInrRate } from "../../server/market.ts";
import { runPriceForecast } from "../../server/forecaster.ts";
import { AuthError, getUserByToken, loginUser, registerUser } from "../../server/auth.ts";

const app = new Hono();
const now = () => new Date().toISOString();
const detail = (msg: string) => ({ detail: msg });
const supported = Object.keys(SUPPORTED_COINS);

app.get("/api/health", (c) =>
  c.json({ status: "healthy", service: "Cryptocurrency Price Forecaster Backend", timestamp: now() }),
);

app.post("/api/auth/login", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  try {
    const user = await loginUser(body.email, body.password);
    return c.json({ user, message: "Login successful" });
  } catch (e) {
    if (e instanceof AuthError) return c.json(detail(e.message), 401);
    console.error("Login error:", e);
    return c.json(detail("Internal server error"), 500);
  }
});

app.post("/api/auth/register", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  try {
    const user = await registerUser(body.name, body.email, body.password);
    return c.json({ user, message: "Registration successful" });
  } catch (e) {
    if (e instanceof AuthError) return c.json(detail(e.message), 400);
    console.error("Registration error:", e);
    return c.json(detail("Internal server error"), 500);
  }
});

app.get("/api/auth/me", async (c) => {
  const header = c.req.header("authorization");
  if (!header) return c.json(detail("Missing authorization token"), 401);
  const user = await getUserByToken(header.replace("Bearer ", "").trim());
  if (!user) return c.json(detail("Invalid or expired session token"), 401);
  return c.json(user);
});

app.get("/api/coins", (c) => c.json(Object.values(SUPPORTED_COINS).map(({ yf_symbol: _y, ...rest }) => rest)));

app.get("/api/rate/usd-inr", async (c) =>
  c.json({ base: "USD", target: "INR", rate: await getUsdToInrRate(), timestamp: now() }),
);

app.get("/api/market/overview", async (c) => {
  try {
    const [coins, rate] = await Promise.all([getMarketOverview(), getUsdToInrRate()]);
    return c.json({ coins, usd_to_inr_rate: rate, last_updated: now() });
  } catch (e) {
    console.error("Failed to generate market overview:", e);
    return c.json(detail(String(e)), 500);
  }
});

app.get("/api/market/historical/:symbol", async (c) => {
  const symbol = c.req.param("symbol");
  if (!SUPPORTED_COINS[symbol]) {
    return c.json(detail(`Coin symbol '${symbol}' not found. Supported symbols: ${supported.join(", ")}`), 404);
  }
  const range = (c.req.query("range") ?? "1Y").toUpperCase();
  if (!VALID_RANGES[range]) {
    return c.json(detail(`Invalid range '${range}'. Valid ranges are: ${Object.keys(VALID_RANGES).join(", ")}`), 400);
  }
  try {
    return c.json(await getCoinHistoricalData(symbol, range));
  } catch (e) {
    console.error(`Error fetching historical data for ${symbol}:`, e);
    return c.json(detail(String(e)), 500);
  }
});

app.get("/api/forecast/:symbol", async (c) => {
  const symbol = c.req.param("symbol");
  if (!SUPPORTED_COINS[symbol]) {
    return c.json(detail(`Coin symbol '${symbol}' not found. Supported symbols: ${supported.join(", ")}`), 404);
  }
  const days = Number(c.req.query("days") ?? 7);
  if (!Number.isInteger(days) || days < 1 || days > 30) {
    return c.json(detail("days must be an integer between 1 and 30"), 422);
  }
  try {
    return c.json(await runPriceForecast(symbol, days));
  } catch (e) {
    console.error(`Forecasting error for ${symbol}:`, e);
    return c.json(detail(e instanceof Error ? e.message : String(e)), 500);
  }
});

app.notFound((c) => c.json(detail("Not Found"), 404));

export default app;

// Only API requests go to the server; everything else is the static React app.
export const config = {
  path: "/api/*",
};
