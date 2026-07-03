import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import type { User } from "../../drizzle/schema";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Anonymous fallback user when no auth is present
// This allows the app to work without Manus OAuth login
const ANONYMOUS_USER: User = {
  id: 1,
  openId: "anonymous-local-user",
  name: "Local User",
  email: null,
  loginMethod: null,
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  // Auth bypass: use anonymous user if no authenticated user
  const user = ctx.user || ANONYMOUS_USER;

  return next({
    ctx: {
      ...ctx,
      user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    // Auth bypass: use anonymous user (admin role) if no authenticated user
    const user = ctx.user || ANONYMOUS_USER;

    return next({
      ctx: {
        ...ctx,
        user,
      },
    });
  }),
);
