import argon2 from "argon2";
import { Instant } from "@js-joda/core";

import { generateId } from "hornbeam-common/lib/app/ids";
import { UserAddEffect, UserAddMutation } from "hornbeam-common/lib/app/users";
import { UserRepository } from "../repositories/users";

export class UserService {
  private readonly userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  public async add(mutation: UserAddMutation): Promise<UserAddEffect> {
    const passwordHash = await argon2.hash(mutation.password);

    const effect: UserAddEffect = {
      createdAt: Instant.now(),
      emailAddress: mutation.emailAddress,
      id: generateId(),
      passwordHash,
    };

    await this.userRepository.add(effect);

    return effect;
  }

  public async authenticate({emailAddress, password}: Credentials): Promise<string | null> {
    const authDetails = await this.userRepository.fetchAuthDetailsByEmailAddress(emailAddress);

    if (authDetails === null) {
      return null;
    }

    if (await argon2.verify(authDetails.passwordHash, password)) {
      return authDetails.id;
    } else {
      return null;
    }
  }
}

interface Credentials {
  emailAddress: string;
  password: string;
}
