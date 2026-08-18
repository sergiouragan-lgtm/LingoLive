import { dbAdmin, authAdmin } from '../../server/config/firebaseAdmin';

const email = 'sergiouragan@gmail.com';

async function deleteUser() {
  console.log(`Deleting user data for: ${email}`);
  try {
    // 1. Delete from Firestore
    const usersSnapshot = await dbAdmin.collection("users").where("email", "==", email).get();
    for (const doc of usersSnapshot.docs) {
      console.log(`Deleting Firestore user: ${doc.id}`);
      await doc.ref.delete();
    }
    
    // 2. Delete from Auth
    const userRecord = await authAdmin.getUserByEmail(email);
    console.log(`Deleting Auth user: ${userRecord.uid}`);
    await authAdmin.deleteUser(userRecord.uid);
    
    console.log('User deleted successfully.');
  } catch (e: any) {
    console.error('Error deleting user:', e.message);
  }
}

deleteUser();
