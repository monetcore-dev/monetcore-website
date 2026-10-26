import { registerHooks } from "node:module";
const root = new URL("../", import.meta.url);
const mock = new URL("./integrations.mjs", import.meta.url).href;
registerHooks({
  resolve(specifier, context, next) {
    if (
      [
        "nodemailer",
        "@/app/lib/supabaseAdmin",
        "@/app/lib/bookingRepository",
        "@/app/lib/googleCalendar",
      ].includes(specifier)
    )
      return { url: mock, shortCircuit: true };
    if (specifier === "server-only")
      return {
        url: new URL("./server-only.mjs", import.meta.url).href,
        shortCircuit: true,
      };
    if (specifier === "next/server") return next("next/server.js", context);
    if (specifier.startsWith("@/"))
      return next(new URL(specifier.slice(2) + ".ts", root).href, context);
    try {
      return next(specifier, context);
    } catch (error) {
      if (specifier.startsWith(".") && !/\.[a-z]+$/i.test(specifier))
        return next(specifier + ".ts", context);
      throw error;
    }
  },
});
