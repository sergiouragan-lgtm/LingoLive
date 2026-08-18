import admin from "firebase-admin";
import { cert } from "firebase-admin/app";
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

    // Prioridade 1: credencial explícita via variável de ambiente (JSON em string).
    // Formato ideal para plataformas de deploy (Render, Vercel) onde não há
    // sistema de ficheiros persistente para guardar o .json da conta de serviço.
    const explicitCredentialJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (explicitCredentialJson) {
      try {
        const serviceAccount = JSON.parse(explicitCredentialJson);
        options.credential = cert(serviceAccount);
        options.projectId = serviceAccount.project_id;
        console.log(`[Firebase Admin] Using explicit service account credential from FIREBASE_SERVICE_ACCOUNT_KEY for project: ${serviceAccount.project_id}`);
      } catch (parseErr: any) {
        console.error(`[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY: ${parseErr.message}`);
      }
    }

    // Prioridade 2: apenas o Project ID (usa Application Default Credentials,
    // por exemplo via GOOGLE_APPLICATION_CREDENTIALS a apontar para um ficheiro local,
    // ou credenciais ambiente quando corre dentro da infraestrutura da Google).
    if (!options.credential) {
      if (firebaseProjectID) {
        options.projectId = firebaseProjectID;
        console.log(`[Firebase Admin] Using explicit Firebase Project ID from config: ${firebaseProjectID}`);
      } else if (ambientProjectId) {
        options.projectId = ambientProjectId;
        console.log(`[Firebase Admin] Using ambient GCP Project ID: ${ambientProjectId}`);
      }
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
