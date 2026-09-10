class WordTiming {
  const WordTiming({
    required this.text,
    required this.startMs,
    required this.endMs,
  });
  final String text;
  final int startMs;
  final int endMs;
  static int activeIndex(List<WordTiming> words, Duration position) {
    final ms = position.inMilliseconds;
    var low = 0;
    var high = words.length - 1;
    while (low <= high) {
      final mid = (low + high) >> 1;
      final word = words[mid];
      if (ms < word.startMs) {
        high = mid - 1;
      } else if (ms >= word.endMs) {
        low = mid + 1;
      } else {
        return mid;
      }
    }
    return -1;
  }
}
