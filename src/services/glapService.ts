import { db } from "../firebase";
import { collection, getDocs, updateDoc, doc, query, where } from "firebase/firestore";
import { LanguagePolicy, ReviewConflict, ApprovalRequest } from "../types/glap";

export const fetchActiveDialectReviews = async (): Promise<ApprovalRequest[]> => {
  const q = query(collection(db, "glap_approvals"), where("status", "==", "pending"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ApprovalRequest));
};

export const updateLanguagePolicy = async (policyId: string, data: Partial<LanguagePolicy>): Promise<void> => {
  await updateDoc(doc(db, "glap_policies", policyId), data);
};

export const resolveConflict = async (conflictId: string, status: 'resolved'): Promise<void> => {
  await updateDoc(doc(db, "glap_conflicts", conflictId), { status });
};
