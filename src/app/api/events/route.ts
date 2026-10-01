import { NextResponse } from "next/server";
import { z } from "zod";
import { track } from "@/server/analytics";
import { getPlayerId, parseBody, withErrors } from "@/server/http";

/** Only events that originate in the browser; gameplay events are tracked server-side. */
const bodySchema = z.object({
  name: z.enum(["share_clicked"]),
  gameId: z.uuid().nullable().default(null),
  properties: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export const POST = withErrors(async (req: Request) => {
  const playerId = getPlayerId(req);
  const body = await parseBody(req, bodySchema);
  await track({ name: body.name, playerId, gameId: body.gameId, properties: body.properties });
  return NextResponse.json({ ok: true });
});
