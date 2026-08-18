import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import path from "path";
import fs from "fs";
import { ENABLE_SANDBOX_FALLBACK } from "./env";

let dbAdmin: any = null;

try {
  let firebaseProjectID = "";
  let firestoreDatabaseId = "";
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      firebaseProjectID = config.projectId || "";
      firestoreDatabaseId = config.firestoreDatabaseId || "";
    } catch (parseErr) {
      console.error("Error parsing firebase-applet-config.json:", parseErr);
    }
  }

  let app: any;
  if (admin.getApps().length === 0) {
    const options: any = {};
    const ambientProjectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT;
    if (firebaseProjectID) {
      options.projectId = firebaseProjectID;
      console.log(`[Firebase Admin] Using explicit Firebase Project ID from config: ${firebaseProjectID}`);
    } else if (ambientProjectId) {
      options.projectId = ambientProjectId;
      console.log(`[Firebase Admin] Using ambient GCP Project ID: ${ambientProjectId}`);
    }
    app = admin.initializeApp(options);
  } else {
    app = admin.getApps()[0];
  }

  if (firestoreDatabaseId) {
    dbAdmin = getFirestore(app, firestoreDatabaseId);
  } else {
    dbAdmin = getFirestore(app);
  }
  console.log(`Firebase Admin initialized successfully for project: ${process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT || firebaseProjectID || "default"}, database: ${firestoreDatabaseId || "(default)"}`);
} catch (err: any) {
  console.warn(`[Firebase Initialization Warning] Failed to initialize Firebase Admin: ${err.message}`);
  if (!ENABLE_SANDBOX_FALLBACK) {
    throw err;
  }
}

export async function verifyFirebaseConnection() {
  if (!dbAdmin) {
    throw new Error("Firebase Admin (Firestore) is not initialized.");
  }
  // Optional: Perform a dummy operation to verify connectivity
  // await dbAdmin.app().name();
  return true;
}

export { admin, dbAdmin };
export const authAdmin = admin.getApps().length > 0 ? getAuth() : null;
