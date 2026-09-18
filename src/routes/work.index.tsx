import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * The unified project feed now lives on the homepage itself (see
 * routes/index.tsx) — there is no separate landing screen before it anymore.
 * This route stays only so old links/bookmarks to /work?tag=... still land
 * on the right filtered view.
 */
export const Route = createFileRoute("/work/")({
  loader: () => {
    throw redirect({ to: "/", search: true });
  },
});
