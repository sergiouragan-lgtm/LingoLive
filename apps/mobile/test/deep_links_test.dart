import 'package:flutter_test/flutter_test.dart';
import 'package:lingolive_mobile/core/deep_links.dart';

void main() {
  group('DeepLinkListener.parse', () {
    test('reconhece o retorno de sucesso e extrai a sessão', () {
      final result = DeepLinkListener.parse(
        Uri.parse('lingolive://billing/success?session_id=cs_test_123'),
      );
      expect(result, isNotNull);
      expect(result!.success, isTrue);
      expect(result.sessionId, 'cs_test_123');
    });

    test('reconhece o cancelamento sem sessão', () {
      final result = DeepLinkListener.parse(
        Uri.parse('lingolive://billing/cancel'),
      );
      expect(result, isNotNull);
      expect(result!.success, isFalse);
      expect(result.sessionId, isNull);
    });

    test('ignora links de outro esquema ou domínio', () {
      expect(
        DeepLinkListener.parse(
          Uri.parse('https://exemplo.com/billing/success'),
        ),
        isNull,
      );
      expect(
        DeepLinkListener.parse(Uri.parse('lingolive://outra/success')),
        isNull,
      );
      expect(
        DeepLinkListener.parse(Uri.parse('lingolive://billing/desconhecido')),
        isNull,
      );
    });
  });
}
