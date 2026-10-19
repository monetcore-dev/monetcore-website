"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
export type ProjectDraft = {
  id: number;
  service: string;
  budget: string;
  message: string;
};
const ProjectPlanContext = createContext<{
  draft: ProjectDraft | null;
  applyDraft: (draft: Omit<ProjectDraft, "id">) => void;
} | null>(null);
export function useProjectPlan() {
  return useContext(ProjectPlanContext);
}
export function ProjectPlanProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<ProjectDraft | null>(null);
  const sequence = useRef(0);
  function applyDraft(fields: Omit<ProjectDraft, "id">) {
    sequence.current += 1;
    setDraft({ ...fields, id: sequence.current });
  }
  return (
    <ProjectPlanContext.Provider value={{ draft, applyDraft }}>
      {children}
    </ProjectPlanContext.Provider>
  );
}
