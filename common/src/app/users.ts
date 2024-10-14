import { Instant } from "@js-joda/core";

export interface UserAuthDetails {
  id: string;
  passwordSalt: string;
  passwordHash: string;
}

export interface UserAddEffect {
  createdAt: Instant,
  emailAddress: string;
  id: string;
  passwordSalt: string;
  passwordHash: string;
}
