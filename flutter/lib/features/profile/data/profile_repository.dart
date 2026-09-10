import 'package:cloud_firestore/cloud_firestore.dart';

import '../domain/student_profile.dart';

class ProfileRepository {
  ProfileRepository({FirebaseFirestore? firestore})
    : _firestore = firestore ?? FirebaseFirestore.instance;
  final FirebaseFirestore _firestore;
  Future<StudentProfile> load(String uid) async {
    final snapshot = await _firestore
        .collection('intelligentProfiles')
        .doc(uid)
        .get();
    if (!snapshot.exists) throw StateError('INTELLIGENT_PROFILE_NOT_FOUND');
    return StudentProfile.fromMap(snapshot.data()!);
  }
}
