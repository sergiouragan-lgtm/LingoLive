import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RefreshCw, Volume2 } from "lucide-react";
import { getAuth } from "firebase/auth";

export interface KaraokeWord { index: number; text: string; startMs: number; endMs: number }
export interface KaraokeAsset { id: string; text: string; durationMs: number; words: KaraokeWord[]; audioUrl: string; schemaVersion: "1.0" }

export function findActiveWordIndex(words: KaraokeWord[], positionMs: number): number {
  let low = 0; let high = words.length - 1; let match = -1;
  while (low <= high) {
    const middle = (low + high) >> 1; const word = words[middle];
    if (positionMs < word.startMs) high = middle - 1;
    else if (positionMs >= word.endMs) low = middle + 1;
    else { match = middle; break; }
  }
  return match;
}

export function KaraokePlayer({ assetId, initialAsset, initialAudioUrl }: { assetId: string; initialAsset?: KaraokeAsset; initialAudioUrl?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [asset, setAsset] = useState<KaraokeAsset | null>(initialAsset || null);
  const [audioUrl, setAudioUrl] = useState<string | null>(initialAudioUrl || null);
  const [positionMs, setPositionMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const token = await getAuth().currentUser?.getIdToken();
      if (!token) throw new Error("AUTH_REQUIRED");
      const headers = { Authorization: `Bearer ${token}` };
      const metadataResponse = await fetch(`/api/ebook/audio/${assetId}`, { headers });
      if (!metadataResponse.ok) throw new Error("METADATA_FAILED");
      const nextAsset = (await metadataResponse.json()).asset as KaraokeAsset;
      const audioResponse = await fetch(nextAsset.audioUrl, { headers });
      if (!audioResponse.ok) throw new Error("AUDIO_FAILED");
      const url = URL.createObjectURL(await audioResponse.blob());
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = url; setAsset(nextAsset); setAudioUrl(url);
    } catch { setError(true); }
  }, [assetId]);

  useEffect(() => { if (!initialAsset || !initialAudioUrl) void load(); return () => { if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current); }; }, [load, initialAsset, initialAudioUrl]);
  useEffect(() => { if (audioRef.current) audioRef.current.playbackRate = speed; }, [speed]);
  const activeWord = useMemo(() => asset ? findActiveWordIndex(asset.words, positionMs) : -1, [asset, positionMs]);
  const toggle = async () => { const audio = audioRef.current; if (!audio) return; if (audio.paused) await audio.play(); else audio.pause(); };
  const seek = (value: number) => { const audio = audioRef.current; if (!audio) return; audio.currentTime = value / 1000; setPositionMs(value); };

  if (error) return <div role="alert" className="rounded-ui-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">Não foi possível carregar o áudio.<button onClick={() => void load()} className="ml-2 inline-flex items-center gap-1 font-bold"><RefreshCw className="size-4"/>Tentar novamente</button></div>;
  if (!asset || !audioUrl) return <div role="status" className="rounded-ui-md border border-ui-border p-4 text-sm text-ui-text-muted">A carregar áudio sincronizado…</div>;

  return <section aria-label="Leitor de áudio sincronizado" className="rounded-ui-lg border border-violet-200 bg-violet-50 p-4">
    <audio ref={audioRef} src={audioUrl} preload="metadata" onPlay={() => setPlaying(true)} onPause={() => { setPlaying(false); setPositionMs((audioRef.current?.currentTime || 0) * 1000); }} onTimeUpdate={() => setPositionMs((audioRef.current?.currentTime || 0) * 1000)} onSeeking={() => setPositionMs((audioRef.current?.currentTime || 0) * 1000)} onEnded={() => { setPlaying(false); setPositionMs(asset.durationMs); }} onError={() => setError(true)} />
    <div className="flex flex-wrap items-center gap-3"><button type="button" onClick={() => void toggle()} aria-label={playing ? "Pausar áudio" : "Reproduzir áudio"} className="grid size-11 place-items-center rounded-full bg-brand-primary text-white">{playing ? <Pause className="size-5"/> : <Play className="size-5"/>}</button><Volume2 className="size-5 text-violet-700"/><input aria-label="Posição do áudio" type="range" min={0} max={asset.durationMs} step={50} value={Math.min(positionMs, asset.durationMs)} onChange={event => seek(Number(event.target.value))} className="min-w-40 flex-1"/><label className="text-sm font-semibold text-ui-text">Velocidade <select aria-label="Velocidade de reprodução" value={speed} onChange={event => setSpeed(Number(event.target.value))} className="ml-1 rounded-ui-sm border border-ui-border bg-white p-2">{[.75, 1, 1.25, 1.5].map(value => <option key={value} value={value}>{value}×</option>)}</select></label></div>
    <p aria-live="polite" className="mt-4 text-lg leading-9">{asset.words.map((word, index) => <React.Fragment key={`${word.index}-${word.startMs}`}><span className={index === activeWord ? "rounded bg-amber-200 px-1 font-bold text-amber-950" : "text-ui-text"}>{word.text}</span>{" "}</React.Fragment>)}</p>
  </section>;
}
