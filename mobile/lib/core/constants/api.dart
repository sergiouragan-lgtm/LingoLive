abstract class ApiConstants {
  // Change to your deployed server URL in production.
  // For local development with a device: use your machine's local IP.
  // For emulator: use http://10.0.2.2:3000
  static const baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );

  // Ebook endpoints
  static const ebookBase      = '/api/ebook';
  static const ebookStudent   = '/api/ebook/student';
  static const ebookAssistant = '/api/ebook/assistant';
  static const ebookReviews   = '/api/ebook/reviews';

  // Timeouts
  static const connectTimeout = Duration(seconds: 15);
  static const receiveTimeout = Duration(seconds: 30);
}
