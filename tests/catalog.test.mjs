import { test } from "node:test";
import assert from "node:assert/strict";
import {
  services,
  products,
  enquiryHref,
} from "../app/config/offeringCatalog.ts";
import {
  campaignPlan,
  technologyRoadmap,
  technologyChallenges,
  marketingIndustries,
  marketingGoals,
  marketingPlatforms,
} from "../app/config/demoPlanning.ts";
test("offering catalog has all seven services and six honestly labelled products", () => {
  assert.equal(services.length, 7);
  assert.equal(products.length, 6);
  assert.equal(
    new Set([
      ...services.map((s) => `/services/${s.slug}`),
      ...products.map((p) => `/products/${p.slug}`),
    ]).size,
    13,
  );
  for (const s of services) {
    assert.ok(s.features.length >= 8);
    assert.equal(s.challenges.length, 3);
    assert.equal(s.industries.length, 3);
    assert.ok(s.usecase);
    assert.ok(
      enquiryHref("service", s.slug).includes(
        encodeURIComponent(`service:${s.slug}`),
      ),
    );
  }
  for (const p of products) {
    assert.ok(p.features.length >= 6);
    assert.match(p.status, /concept|demonstration|simulation|prototype/i);
    assert.ok(services.some((s) => s.slug === p.related));
    assert.ok(p.disclosure.length > 100);
  }
  assert.ok(
    services
      .find((s) => s.slug === "digital-marketing")
      .features.includes("Google Ads"),
  );
});
test("campaign generator validates inputs and produces consistent calendars across 540 combinations", () => {
  let count = 0;
  for (const industry of marketingIndustries)
    for (const goal of marketingGoals)
      for (let mask = 1; mask < 16; mask++)
        for (const weeks of [2, 4, 6]) {
          const platforms = marketingPlatforms.filter(
            (_, i) => mask & (1 << i),
          );
          const plan = campaignPlan(industry, goal, platforms, weeks);
          assert.equal(plan.calendar.length, weeks);
          assert.deepEqual(plan.platforms, platforms);
          assert.ok(plan.calendar.every((w) => platforms.includes(w.channel)));
          assert.equal(plan.industry, industry);
          count++;
        }
  assert.equal(count, 540);
  for (const args of [
    ["Unknown", "Enquiries", ["Instagram"], 4],
    ["Retail", "Unknown", ["Instagram"], 4],
    ["Retail", "Enquiries", [], 4],
    ["Retail", "Enquiries", ["Unknown"], 4],
    ["Retail", "Enquiries", ["Instagram"], 3],
  ])
    assert.equal(campaignPlan(...args), null);
});
test("assessment handles all challenge combinations and rejects unrecognized-only selections", () => {
  assert.deepEqual(technologyRoadmap(["unknown"]), []);
  for (let mask = 0; mask < 32; mask++) {
    const selected = technologyChallenges.filter((_, i) => mask & (1 << i));
    const road = technologyRoadmap(selected);
    if (!mask) {
      assert.deepEqual(road, []);
      continue;
    }
    assert.match(road[0], /^Discover:/);
    assert.match(road.at(-1), /^Review:/);
    assert.equal(
      road.some((s) => s.startsWith("Organise:")),
      selected.includes("Scattered customer records"),
    );
    assert.equal(
      road.some((s) => s.startsWith("Establish:")),
      selected.includes("Low online visibility"),
    );
  }
});

test("contextual enquiries accept only known identifiers and map to supported form options", async () => {
  const { resolveInterest } = await import("../app/config/offeringCatalog.ts");
  const { contactServiceOptions, bookingServiceOptions } =
    await import("../app/config/enquiryInterests.ts");
  for (const [kind, items] of [
    ["service", services],
    ["product", products],
  ])
    for (const item of items) {
      const id = `${kind}:${item.slug}`;
      const contact = resolveInterest(id);
      const booking = resolveInterest(id, true);
      assert.ok(contactServiceOptions.includes(contact.service));
      assert.ok(bookingServiceOptions.includes(booking.service));
      assert.ok(contact.message.includes(item.title));
      assert.ok(booking.message.includes(item.title));
    }
  for (const invalid of [
    undefined,
    null,
    ["service:ai-automation"],
    "<script>alert(1)</script>",
    "product:missing",
    "service:missing",
    "service:ai-automation:extra",
    "unknown:crm",
  ])
    assert.equal(resolveInterest(invalid), undefined);
});
