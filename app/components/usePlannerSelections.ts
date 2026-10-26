"use client";
import { useSyncExternalStore } from "react";
import {
  plannerCapabilities,
  plannerChallenges,
  enquiryBudgets,
  solutionOptions,
} from "../config/projectPlanner";
import type { SolutionId } from "../config/projectPlanner";
const key = "monetcore-planner-v1";
const event = "monetcore-planner-change";
type Selections = {
  goal: SolutionId | "unsure" | "";
  challenge: string;
  budget: string;
  capabilities: string[];
};
const empty: Selections = {
  goal: "",
  challenge: "",
  budget: "",
  capabilities: [],
};
let fallback: string | null = null;
function snapshot() {
  try {
    return sessionStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}
function subscribe(listener: () => void) {
  window.addEventListener(event, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(event, listener);
    window.removeEventListener("storage", listener);
  };
}
function parse(raw: string | null): Selections {
  try {
    const value = JSON.parse(raw || "null");
    if (!value || typeof value !== "object") return empty;
    return {
      goal:
        value.goal === "unsure" ||
        solutionOptions.some((x) => x.id === value.goal)
          ? value.goal
          : "",
      challenge: plannerChallenges.some((x) => x.id === value.challenge)
        ? value.challenge
        : "",
      budget: enquiryBudgets.some((x) => x.value === value.budget)
        ? value.budget
        : "",
      capabilities: Array.isArray(value.capabilities)
        ? plannerCapabilities
            .filter((x) => value.capabilities.includes(x.id))
            .map((x) => x.id)
        : [],
    };
  } catch {
    return empty;
  }
}
/** Only non-personal multiple-choice answers persist, for this tab's session. */
export function usePlannerSelections() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => null);
  function update(
    patch:
      Partial<Selections> | ((previous: Selections) => Partial<Selections>),
  ) {
    const previous = parse(snapshot());
    fallback = JSON.stringify({
      ...previous,
      ...(typeof patch === "function" ? patch(previous) : patch),
    });
    try {
      sessionStorage.setItem(key, fallback);
    } catch {
      /* Keep in-memory fallback when storage is unavailable. */
    }
    window.dispatchEvent(new Event(event));
  }
  return [parse(raw), update] as const;
}
