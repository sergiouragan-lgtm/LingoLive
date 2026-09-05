/// Configuração injetada no build (`--dart-define`).
///
/// Nenhum valor sensível é embutido no binário: a base URL aponta para o
/// backend LingoLIVE, que é quem detém as chaves de Stripe, Gemini e FCM.
class AppConfig {
  const AppConfig({
    required this.apiBaseUrl,
    required this.appVersion,
    required this.flavor,
  });

  factory AppConfig.fromEnvironment() => const AppConfig(
    apiBaseUrl: String.fromEnvironment(
      'LINGOLIVE_API_BASE_URL',
      defaultValue: 'https://app.lingolive.ia',
    ),
    appVersion: String.fromEnvironment('APP_VERSION', defaultValue: '1.0.0'),
    flavor: String.fromEnvironment('APP_FLAVOR', defaultValue: 'internal'),
  );

  final String apiBaseUrl;
  final String appVersion;
  final String flavor;

  bool get isInternalBuild => flavor == 'internal';
}
