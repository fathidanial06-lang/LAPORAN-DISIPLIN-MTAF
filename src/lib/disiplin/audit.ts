// Audit logging helper.
import { db } from "@/lib/db";

export interface AuditInput {
  userId: string;
  userName: string;
  tindakan: string;
  entiti: string;
  entitiId?: string | null;
  nilaiLama?: unknown;
  nilaiBaru?: unknown;
}

export async function logAudit(input: AuditInput): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: input.userId,
        userName: input.userName,
        tindakan: input.tindakan,
        entiti: input.entiti,
        entitiId: input.entitiId ?? null,
        nilaiLama:
          input.nilaiLama != null ? JSON.stringify(input.nilaiLama) : null,
        nilaiBaru:
          input.nilaiBaru != null ? JSON.stringify(input.nilaiBaru) : null,
      },
    });
  } catch (e) {
    // Audit must never break the caller flow.
    console.error("[audit] failed to write audit log:", e);
  }
}
