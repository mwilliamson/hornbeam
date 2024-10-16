import { Instant } from "@js-joda/core";

export interface UserAuthDetails {
  id: string;
  passwordHash: string;
}

export interface UserAddMutation {
  emailAddress: string;
  password: string;
}

export interface UserAddEffect {
  createdAt: Instant,
  emailAddress: string;
  id: string;
  passwordHash: string;
}
