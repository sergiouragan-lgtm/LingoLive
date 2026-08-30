import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../memory/memory_control_screen.dart';
import 'auth_screen.dart';
import 'email_verification_screen.dart';

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<User?>(
      stream: FirebaseAuth.instance.userChanges(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(body: Center(child: CircularProgressIndicator()));
        }
        final user = snapshot.data;
        if (user == null) return const AuthScreen();
        if (!user.emailVerified) return EmailVerificationScreen(user: user);
        return MemoryControlScreen(user: user);
      },
    );
  }
}
