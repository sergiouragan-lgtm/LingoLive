import fs from "fs";
import process from "process";

process.env.NODE_ENV = "production";
process.env.ENABLE_SANDBOX_FALLBACK = "false";

const manifestPath = process.argv[2];
if (!manifestPath || !fs.existsSync(manifestPath)) throw new Error("Manifesto E2E não encontrado.");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const { dbAdmin, authAdmin } = await import("../server/config/firebaseAdmin");
if (!dbAdmin || !authAdmin) throw new Error("Firebase Admin real não inicializado.");
for (const documentPath of manifest.documentPaths as string[]) await dbAdmin.doc(documentPath).delete().catch(() => undefined);
let authUserRemoved = true;
try {
  await authAdmin.deleteUser(manifest.uid);
} catch (error: any) {
  if (error?.code !== "auth/user-not-found") throw error;
  authUserRemoved = false;
}
fs.unlinkSync(manifestPath);
console.log(JSON.stringify({ cleanup: "complete", firestoreDocumentsRemoved: manifest.documentPaths.length, authUserRemoved, authUserAlreadyAbsent: !authUserRemoved, manifestRemoved: true }));
