import 'package:flutter_test/flutter_test.dart';
import 'package:lingolive_mobile/features/audio/domain/word_timing.dart';

void main() {
  const words = [
    WordTiming(text: 'Hello', startMs: 0, endMs: 300),
    WordTiming(text: 'world', startMs: 300, endMs: 700),
  ];
  test('finds active karaoke word at boundaries', () {
    expect(WordTiming.activeIndex(words, Duration.zero), 0);
    expect(WordTiming.activeIndex(words, const Duration(milliseconds: 300)), 1);
    expect(
      WordTiming.activeIndex(words, const Duration(milliseconds: 800)),
      -1,
    );
  });
}
