import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';

import '../domain/word_timing.dart';

class KaraokePlayer extends StatefulWidget {
  const KaraokePlayer({required this.audioUrl, required this.words, super.key});
  final String audioUrl;
  final List<WordTiming> words;
  @override
  State<KaraokePlayer> createState() => _KaraokePlayerState();
}

class _KaraokePlayerState extends State<KaraokePlayer> {
  final player = AudioPlayer();
  @override
  void initState() {
    super.initState();
    player.setUrl(widget.audioUrl);
  }

  @override
  void dispose() {
    player.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => StreamBuilder<Duration>(
    stream: player.positionStream,
    initialData: Duration.zero,
    builder: (context, snapshot) {
      final position = snapshot.data!;
      final active = WordTiming.activeIndex(widget.words, position);
      final maximum = (player.duration?.inMilliseconds ?? 1).toDouble();
      return Column(
        children: [
          Wrap(
            spacing: 5,
            runSpacing: 5,
            children: [
              for (var i = 0; i < widget.words.length; i++)
                AnimatedContainer(
                  duration: const Duration(milliseconds: 120),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 4,
                    vertical: 2,
                  ),
                  color: i == active
                      ? Colors.amber.shade200
                      : Colors.transparent,
                  child: Text(widget.words[i].text),
                ),
            ],
          ),
          Row(
            children: [
              StreamBuilder<bool>(
                stream: player.playingStream,
                initialData: false,
                builder: (_, playing) => IconButton(
                  tooltip: playing.data! ? 'Pausar' : 'Reproduzir',
                  onPressed: () =>
                      playing.data! ? player.pause() : player.play(),
                  icon: Icon(playing.data! ? Icons.pause : Icons.play_arrow),
                ),
              ),
              Expanded(
                child: Slider(
                  value: position.inMilliseconds.toDouble().clamp(0, maximum),
                  max: maximum < 1 ? 1 : maximum,
                  onChanged: (value) =>
                      player.seek(Duration(milliseconds: value.round())),
                ),
              ),
              PopupMenuButton<double>(
                tooltip: 'Velocidade',
                onSelected: player.setSpeed,
                itemBuilder: (_) => [
                  for (final speed in [0.75, 1.0, 1.25, 1.5])
                    PopupMenuItem(value: speed, child: Text('${speed}x')),
                ],
              ),
            ],
          ),
        ],
      );
    },
  );
}
