import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/providers/auth_provider.dart';
import '../features/auth/screens/login_screen.dart';
import '../features/auth/screens/register_screen.dart';
import '../features/dashboard/screens/dashboard_screen.dart';
import '../features/library/screens/library_screen.dart';
import '../features/marketplace/screens/marketplace_screen.dart';
import '../features/profile/screens/profile_screen.dart';
import '../features/reader/screens/reader_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: '/dashboard',
    redirect: (context, state) {
      final isLoggedIn = authState.valueOrNull != null;
      final isAuthRoute = state.matchedLocation == '/login' ||
          state.matchedLocation == '/register';

      if (!isLoggedIn && !isAuthRoute) return '/login';
      if (isLoggedIn && isAuthRoute) return '/dashboard';
      return null;
    },
    routes: [
      GoRoute(path: '/login',    builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      GoRoute(
        path: '/dashboard',
        builder: (_, __) => const DashboardScreen(),
      ),
      GoRoute(
        path: '/library',
        builder: (_, __) => const LibraryScreen(),
      ),
      GoRoute(
        path: '/marketplace',
        builder: (_, __) => const MarketplaceScreen(),
      ),
      GoRoute(
        path: '/reader/:ebookId',
        builder: (_, state) => ReaderScreen(
          ebookId: state.pathParameters['ebookId']!,
        ),
      ),
      GoRoute(
        path: '/profile',
        builder: (_, __) => const ProfileScreen(),
      ),
    ],
  );
});
