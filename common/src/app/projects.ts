import { Instant } from "@js-joda/core";

export interface Project {
  id: string;
  name: string;
}

export interface ProjectAddMutation {
  createdAt: Instant;
  id: string;
  name: string;
}

export function createProject(mutation: ProjectAddMutation): Project {
  return {
    id: mutation.id,
    name: mutation.name,
  };
}
