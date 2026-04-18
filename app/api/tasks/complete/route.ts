import { NextResponse } from 'next/server';
import { inngest } from '@/src/lib/inngest/client';
// import { sql } from "@/lib/db"; // si tu as Neon/Postgres

export async function POST(req: Request) {
  const body = await req.json();
  const { taskId, userId, locale } = body as {
    taskId: string;
    userId: string;
    locale: string;
  };

  // 1) Update DB : marquer la tâche comme terminée
  // await sql`update tasks set completed_at = now() where id = ${taskId} and user_id=${userId}`;

  // 2) Émettre un event avec un ID stable (= dedupe)
  // => si l’utilisateur clique 2 fois / retry réseau, Inngest ne renverra pas l’email
  const eventId = `task:${taskId}:completed`;

  await inngest.send({
    id: eventId, // <-- clé
    name: 'task/completed',
    data: {
      taskId,
      userId,
      locale: locale || 'fr',
    },
  });

  return NextResponse.json({ ok: true });
}
