"use client";

/**
 * Player de Mux para reproducir videos firmados (signed playback URLs).
 *
 * Para signed URLs, la URL firmada se pasa al componente via prop.
 * Para public URLs (si en el futuro cambias la policy), solo pasas el playbackId.
 *
 * Usa @mux/mux-player-react que internamente carga HLS.js para navegadores
 * que no soportan HLS nativamente (Chrome, Firefox) y nativo en Safari.
 */
import MuxPlayer from '@mux/mux-player-react';

interface MuxVideoPlayerProps {
  /** ID del playback en Mux (guardado en la Submission como muxPlaybackId) */
  playbackId: string;
  /** URL firmada (generada server-side). Si no la pasas, asume public playback. */
  signedUrl?: string;
  /** Opcional: thumbnail para mostrar antes de play (ahorra bandwidth) */
  poster?: string;
  /** Auto-play (cuidado: browsers lo bloquean si no está muted) */
  autoPlay?: boolean;
  className?: string;
}

export default function MuxVideoPlayer({
  playbackId,
  signedUrl,
  poster,
  autoPlay = false,
  className = '',
}: MuxVideoPlayerProps) {
  // Si nos pasan signedUrl, la usamos (caso de signed playback policy).
  // Si no, Mux Player puede usar el playbackId directamente (caso public).
  const src = signedUrl || undefined;

  return (
    <MuxPlayer
      // Importante: NO pasamos `playbackId` cuando usamos signedUrl para que
      // Mux Player no intente construir la URL pública él mismo.
      {...(src ? { src } : { playbackId })}
      streamType="on-demand"
      poster={poster}
      autoPlay={autoPlay}
      accentColor="#06b6d4" // cyan-500 de tu design system
      className={className}
      style={{
        width: '100%',
        aspectRatio: '16 / 9',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    />
  );
}