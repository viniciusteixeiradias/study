export interface Condition {
  [key: string]: {
    equals?: string | number
    contains?: string
    gte?: string
    lt?: string
  };
}

interface IQuery {
  build(): Condition;
  withEquals(field: string, value: string | number | undefined): IQuery;
  withContains(field: string, value: string | undefined): IQuery;
  withNested(field: string, ...conditions: (Condition | undefined)[]): IQuery;
  withDate(field: string, value: Date | undefined): IQuery;
}

class QueryBuilder implements IQuery {
  private conditions: Condition[] = []

  constructor() {}

  withEquals(field: string, value: string | number | undefined) {
    if (value) {
      this.conditions.push({ [field]: { equals: value } });
    }

    return this;
  }

  withContains(field: string, value: string | undefined) {
    if (value) {
      this.conditions.push({ [field]: { contains: value } });
    }

    return this;
  }

  withNested(field: string, ...conditions: (Condition | undefined)[]) {
    this.conditions.push({ [field]: Object.assign({}, ...conditions) });
    return this;
  }

  withDate(field: string, value: Date | undefined) {
    if (!value) {
      return this;
    }

    const startOfDay = new Date(value);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(value);
    endOfDay.setHours(23, 59, 59, 999);

    this.conditions.push({
      [field]: {
        gte: startOfDay.toISOString(),
        lt: endOfDay.toISOString()
      }
    });

    return this;
  }

  build() {
    return Object.assign({}, ...this.conditions);
  }
}

interface Filters {
    id: number;
    createdAt: Date;
    updatedAt?: Date;
    first_name: string;
    last_name?: string;
    likes: {
        music: string;
        movies: string;
    }
}

const dao = {
  find: (...conditions: Condition[]) => {
    const where = Object.assign({}, ...conditions);
    console.info('Search:', where);
  }
}

const routes = {
  find: (filters: Filters) => {
    const query: IQuery = new QueryBuilder();
    const nestedQuery: IQuery = new QueryBuilder();

    const likes = nestedQuery
      .withEquals("music", filters.likes.music)
      .withEquals("movies", filters.likes.movies)
      .build()

    const conditions = query
      .withEquals("id", filters.id)
      .withContains("first_name", filters.first_name)
      .withContains("last_name", filters.last_name)
      .withDate("createdAt", filters.createdAt)
      .withDate("updatedAt", filters.updatedAt)
      .withNested("likes", likes)
      .build();

    dao.find(conditions)
  }
}

routes.find({
  id: 1,
  first_name: "vinicius",
  createdAt: new Date(),
  likes: {
    music: "classic",
    movies: "t"
  }
})
