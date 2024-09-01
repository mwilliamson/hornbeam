import { Category, CategoryAddRequest } from "hornbeam-common/lib/app/categories";
import { AppSnapshot } from "hornbeam-common/lib/app/snapshots";

export interface CategoryRepository {
  add: (request: CategoryAddRequest) => Promise<void>;
  fetchAll: () => Promise<ReadonlyArray<Category>>;
}

export class CategoryRepositoryInMemory implements CategoryRepository {
  private snapshot: AppSnapshot;

  constructor(initialSnapshot: AppSnapshot) {
    this.snapshot = initialSnapshot;
  }

  async add(request: CategoryAddRequest): Promise<void> {
    this.snapshot = this.snapshot.categoryAdd(request);
  }

  async fetchAll(): Promise<ReadonlyArray<Category>> {
    return this.snapshot.allCategories();
  }
}
