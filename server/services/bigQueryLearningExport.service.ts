import crypto from "node:crypto";
import { getApps } from "firebase-admin/app";
import { dbAdmin } from "../config/firebaseAdmin";

const RESOURCE_ID = /^[A-Za-z0-9_]+$/;
const MAX_EXPORT_ROWS = 5_000;

export interface LearningExportRow {
  progress_id: string;
  learner_hash: string;
  course_id: string;
  cefr_level: string | null;
  xp: number;
  streak_days: number;
  version: number;
  updated_at: string | null;
}

export function toLearningExportRow(id: string, data: Record<string, unknown>): LearningExportRow {
  const userId = typeof data.userId === "string" ? data.userId : "";
  return {
    progress_id: id,
    learner_hash: crypto.createHash("sha256").update(userId).digest("hex"),
    course_id: typeof data.courseId === "string" ? data.courseId : "",
    cefr_level: typeof data.cefrLevel === "string" ? data.cefrLevel : null,
    xp: Number.isFinite(data.xp) ? Number(data.xp) : 0,
    streak_days: Number.isFinite(data.streakDays) ? Number(data.streakDays) : 0,
    version: Number.isFinite(data.version) ? Number(data.version) : 0,
    updated_at: typeof data.updatedAt === "string" ? data.updatedAt : null,
  };
}

function requiredResourceId(name: string): string {
  const value = process.env[name]?.trim();
  if (!value || !RESOURCE_ID.test(value)) {
    throw new Error(`${name}_NOT_CONFIGURED`);
  }
  return value;
}

export async function exportLearningProgressToBigQuery() {
  if (!dbAdmin) throw new Error("FIRESTORE_UNAVAILABLE");

  const projectId = process.env.BIGQUERY_PROJECT_ID?.trim()
    || process.env.GOOGLE_CLOUD_PROJECT?.trim()
    || process.env.GCP_PROJECT?.trim();
  if (!projectId || !/^[A-Za-z0-9_:-]+$/.test(projectId)) {
    throw new Error("BIGQUERY_PROJECT_ID_NOT_CONFIGURED");
  }
  const datasetId = requiredResourceId("BIGQUERY_DATASET");
  const tableId = requiredResourceId("BIGQUERY_TABLE");

  const snapshot = await dbAdmin.collection("learning_progress").limit(MAX_EXPORT_ROWS).get();
  const rows = snapshot.docs.map((doc: any) => ({
    insertId: `${doc.id}:${doc.data().version ?? 0}`,
    json: toLearningExportRow(doc.id, doc.data()),
  }));

  if (rows.length > 0) {
    const credential = getApps()[0]?.options.credential;
    if (!credential) throw new Error("GOOGLE_CREDENTIALS_UNAVAILABLE");
    const accessToken = await credential.getAccessToken();
    const endpoint = `https://bigquery.googleapis.com/bigquery/v2/projects/${encodeURIComponent(projectId)}/datasets/${datasetId}/tables/${tableId}/insertAll`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ kind: "bigquery#tableDataInsertAllRequest", rows }),
    });
    const result = await response.json() as { insertErrors?: unknown[]; error?: { message?: string } };
    if (!response.ok || result.insertErrors?.length) {
      throw new Error(result.error?.message || "BIGQUERY_INSERT_FAILED");
    }
  }

  return {
    id: crypto.randomUUID(),
    destination: `${projectId}.${datasetId}.${tableId}`,
    rowsExported: rows.length,
    timestamp: new Date().toISOString(),
    status: "SUCCESS" as const,
  };
}
