import type { Promisable } from 'type-fest';

export type MiddlewareFunction<Context> = (
  context: Context,
  next: () => Promisable<void>,
) => Promisable<void>;

export class MiddlewareChain<Context> {
  private middlewares: MiddlewareFunction<Context>[] = [];

  public use(middleware: MiddlewareFunction<Context>) {
    this.middlewares.push(middleware);
  }

  public async execute(context: Context): Promise<void> {
    const next = () => {
      const middleware = this.middlewares.shift();
      if (middleware) {
        return middleware(context, next);
      }
    };

    return next();
  }
}
