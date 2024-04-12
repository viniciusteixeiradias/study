export interface Condition {
  [key: string]: {
    equals?: string | number
    contains?: string
    gte?: string
    lt?: string
  };
}

type OptionalCondition = Condition | undefined;

interface IQuery {
  withEquals(field: string, value: string | number): OptionalCondition;
  withContains(field: string, value: string): OptionalCondition;
  withNested(field: string, ...conditions: OptionalCondition[]): OptionalCondition;
  withDate(field: string, value: Date): OptionalCondition;
}

class Query implements IQuery {
    withContains(field: string, value: string | undefined): OptionalCondition {
        if (!value) {
            return;
        }

        return { [field]: { contains: value } };
    }

    withEquals(field: string, value: string | number | undefined): OptionalCondition {
        if (!value) {
            return;
        }

        return { [field]: { equals: value } };
    }

    withNested(field: string, ...conditions: (Condition | undefined)[]): OptionalCondition {
        return { [field]: Object.assign({}, ...conditions) };
    }

    withDate(field: string, value: Date | undefined): Condition | undefined {
        if (!value) {
            return;
        }

        const startOfDay = new Date(value);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(value);
        endOfDay.setHours(23, 59, 59, 999);

        return {
            [field]: {
                gte: startOfDay.toISOString(),
                lt: endOfDay.toISOString(),
            }
        };
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

// Or User Dao, I don't know yet
class UserRoues extends Query {
    constructor(private dao: UserDao) {
        super()
    }

    find(filters: Filters) {
        this.dao.find(
            this.withEquals("id", filters.id),
            this.withContains("first_name", filters.first_name),
            this.withEquals("last_name", filters.last_name),
            this.withDate("createdAt", filters.createdAt),
            this.withDate("updatedAt", filters.updatedAt),
            this.withNested("likes", 
                this.withEquals("music", filters.likes.music),
                this.withContains("movies", filters.likes.movies)
            )
        )
    }
}

class UserDao {
    find(...conditions: (Condition | undefined)[]): void {
        const where = Object.assign({}, ...conditions);
        console.log('Search:', where);
    }
}

const dao = new UserDao();
const routes = new UserRoues(dao);

routes.find({
    id: 1,
    first_name: "vinicius",
    createdAt: new Date(),
    likes: {
        music: "classic",
        movies: "t"
    }
});
