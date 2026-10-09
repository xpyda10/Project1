import { identity, live, sql } from "@/lib/server";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const who = await identity(req).catch(() => null);
  if (!who?.user || !live()) return new Response("Sign in required", { status: 401 });
  const encoder = new TextEncoder();
  let stopped = false;
  const stream = new ReadableStream({
    async start(controller) {
      const deadline = Date.now() + 45000;
      const send = (value: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(value)}\n\n`));
      try {
        while (!stopped && !req.signal.aborted && Date.now() < deadline) {
          const current = await identity(req);
          if (current.user?.id !== who.user?.id) { send({ expired: true }); break; }
          const items = (await sql()`SELECT items FROM carts WHERE id=${who.owner}`)[0]?.items || [];
          // A fresh snapshot also recovers events ignored during a local write.
          send({ items });
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch {
        if (!stopped && !req.signal.aborted) send({ reconnect: true });
      } finally {
        if (!stopped) controller.close();
      }
    },
    cancel() { stopped = true; },
  });
  return new Response(stream, { headers: {
    "Content-Type": "text/event-stream", "Cache-Control": "no-store, no-transform",
    "X-Accel-Buffering": "no", Connection: "keep-alive",
  } });
}
