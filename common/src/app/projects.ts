import { Instant } from "@js-joda/core";

export interface Project {
  id: string;
  name: string;
}

export interface ProjectAddMutation {
  name: string;
}

export interface ProjectAddEffect extends ProjectAddMutation {
  createdAt: Instant;
  id: string;
}

export function createProject(effect: ProjectAddEffect): Project {
  return {
    id: effect.id,
    name: effect.name,
  };
}
