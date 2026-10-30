import test from "node:test";
import assert from "node:assert/strict";
import {
  websitePackages,
  packagePrice,
  packageRenewal,
  packageWhatsAppHref,
  renewalTerms,
  pricingConditions,
} from "../app/config/websitePackages.ts";
import { knowledge } from "../app/lib/assistant/knowledge.ts";

test("published package prices, renewals and enquiry messages match owner-approved commercial terms", () => {
  const approved = [
    ["starter", 99000, 45000, "₦99,000", "₦45,000"],
    ["business", 179000, 60000, "₦179,000", "₦60,000"],
    ["pro", 299000, 90000, "Starting from ₦299,000", "From ₦90,000"],
  ];
  assert.equal(websitePackages.length, approved.length);
  for (const [
    id,
    price,
    renewal,
    displayedPrice,
    displayedRenewal,
  ] of approved) {
    const item = websitePackages.find((p) => p.id === id);
    assert.equal(item.price, price);
    assert.equal(item.renewal, renewal);
    assert.equal(packagePrice(item), displayedPrice);
    assert.equal(packageRenewal(item), displayedRenewal);
    const url = new URL(packageWhatsAppHref(item));
    assert.equal(url.origin + url.pathname, "https://wa.me/2347065880558");
    const message = url.searchParams.get("text");
    for (const value of [
      item.name,
      displayedPrice,
      displayedRenewal,
      renewalTerms.included,
      renewalTerms.excluded,
    ])
      assert.ok(message.includes(value), value);
    const answer = knowledge.find((k) => k.id === `package-${id}`).text;
    assert.ok(answer.includes(displayedPrice));
    assert.ok(answer.includes(displayedRenewal));
    assert.doesNotMatch(
      message + answer,
      /proposed|business approval|approval pending/i,
    );
  }
  assert.doesNotMatch(
    pricingConditions.join(" "),
    /proposed|business approval|approval pending/i,
  );
});

test("renewal support remains scoped and demonstrations retain planned-product disclosures", () => {
  for (const word of [
    "domain renewal",
    "hosting",
    "SSL",
    "basic technical support",
  ])
    assert.ok(renewalTerms.included.includes(word));
  for (const word of [
    "Website redesigns",
    "new pages",
    "additional features",
    "AI integrations",
    "third-party subscriptions",
    "premium-domain",
  ])
    assert.ok(renewalTerms.excluded.includes(word));
  assert.match(
    renewalTerms.limits,
    /does not include unlimited support, guaranteed uptime or free development work/,
  );
  const planned = knowledge.find((k) => k.id === "product-ai-receptionist");
  assert.match(planned.text, /Product concept.*not available for activation/i);
  assert.match(planned.text, /not a ready-to-use hosted product/);
});
