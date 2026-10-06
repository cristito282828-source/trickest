"use client";

/**
 * Componente de upload de video a Mux con estilo arcade.
 *
 * Flujo correcto:
 *  1. Al montar el componente, pedimos al server un "direct upload" (URL firmada)
 *  2. Pasamos la URL al <MuxUploader endpoint={url} />
 *  3. El browser sube directo a Mux (no pasa por nuestro server)
 *  4. Al terminar, llamamos onUploaded(uploadId) para que el padre
 *     haga el POST /api/submissions con ese ID.
 */
import { useState, useEffect } from 'react';
import MuxUploader, {
  MuxUploaderDrop,
  MuxUploaderFileSelect,
  MuxUploaderProgress,
  MuxUploaderStatus,
} from '@mux/mux-uploader-react';

interface MuxUploaderProps {
  /** Callback cuando el upload termina OK. */
  onUploaded: (data: { uploadId: string }) => void;
  /** Callback si falla el upload */
  onError?: (message: string) => void;
}

export default function MuxVideoUploader({ onUploaded, onError }: MuxUploaderProps) {
  const [endpoint, setEndpoint] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [phase, setPhase] = useState<'preparing' | 'ready' | 'uploading' | 'completed' | 'error'>('preparing');
  // Blob URL para preview local del archivo que el usuario acaba de subir
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // ────────────────────────────────────────────────────────────────
  // Pedimos el direct upload URL al montar. Solo UNA VEZ al montar.
  // Si ponemos `onError` en las deps y el padre pasa una función nueva
  // cada render, este efecto se vuelve a correr → remount → input resetea.
  // ────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const fetchUploadUrl = async () => {
      try {
        const res = await fetch('/api/uploads', { method: 'POST' });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Error creando upload' }));
          throw new Error(err.error || 'Error creando upload');
        }
        const { uploadUrl } = await res.json();
        if (!cancelled) {
          setEndpoint(uploadUrl);
          setPhase('ready');
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error desconocido';
        if (!cancelled) {
          setErrorMsg(msg);
          setPhase('error');
        }
      }
    };

    fetchUploadUrl();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSuccess = (event: any) => {
    // muxUploader emite el upload_id en el detalle del evento
    const uploadId: string = event.detail?.upload_id || event.detail?.uploadId || '';

    // Crear un preview local con el File subido, así el usuario ve lo que mandó
    try {
      const uploaderEl = document.querySelector('mux-uploader') as any;
      // Buscar el input file dentro del uploader para sacar el File object
      const fileInput = uploaderEl?.querySelector('input[type="file"]') as HTMLInputElement;
      const file = fileInput?.files?.[0];
      if (file) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }
    } catch (e) {
      console.warn('[uploader] No pude crear preview:', e);
    }

    setPhase('completed');
    if (uploadId) {
      onUploaded({ uploadId });
    } else {
      // En algunas versiones, el upload_id viene en el input hidden
      const input = document.querySelector('mux-uploader') as any;
      const fallbackId = input?.upload_id || '';
      onUploaded({ uploadId: fallbackId });
    }
  };

  const handleUploadStart = () => {
    setPhase('uploading');
  };

  // Mientras preparamos el endpoint, mostramos loading
  if (phase === 'preparing') {
    return (
      <div className="border-4 border-dashed border-neutral-700 bg-neutral-800/60 rounded-lg p-8 md:p-10 text-center">
        <div className="text-5xl mb-3 animate-pulse">⏳</div>
        <p className="text-white font-bold uppercase tracking-wider text-sm md:text-base">
          Preparando uploader...
        </p>
      </div>
    );
  }

  if (phase === 'error' && errorMsg) {
    return (
      <div className="space-y-3">
        <div className="bg-red-500/20 border-4 border-red-500 rounded-lg p-3">
          <p className="text-red-400 font-bold text-sm">❌ {errorMsg}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-2 px-4 rounded-lg uppercase text-xs"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <MuxUploader
        endpoint={endpoint}
        type="bar"
        noDrop={false}
        onUploadStart={handleUploadStart}
        onSuccess={handleSuccess}
        className="block w-full"
      >
        {/* Zona donde el usuario suelta el archivo */}
        <MuxUploaderDrop
          muxUploader="bar"
          className="
            group
            border-4 border-dashed border-neutral-700
            hover:border-accent-cyan-500
            bg-neutral-800/60 hover:bg-neutral-800
            transition-all duration-200
            rounded-lg
            p-8 md:p-10
            text-center
            cursor-pointer
          "
        >
          <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">🎬</div>
          <p className="text-white font-bold uppercase tracking-wider text-sm md:text-base">
            Suelta tu video aquí
          </p>
          <p className="text-neutral-400 text-xs mt-2">
            o haz click para seleccionar · máximo 360 sec
          </p>
        </MuxUploaderDrop>

        {/* Input nativo de selección (oculto visualmente, lo activa MuxUploaderDrop) */}
        <MuxUploaderFileSelect muxUploader="bar" className="hidden">
          <button type="button">Select file</button>
        </MuxUploaderFileSelect>

        {/* Barra de progreso (solo visible durante upload) */}
        <MuxUploaderProgress
          muxUploader="bar"
          className="
            block
            text-sm
            bg-neutral-900
            border-4 border-accent-cyan-500
            rounded-lg
            mt-3
            h-3
            [&::part(bar)]:bg-gradient-to-r
            [&::part(bar)]:from-accent-cyan-500
            [&::part(bar)]:to-accent-purple-500
          "
        />

        {/* Status (errores, etc.) */}
        <MuxUploaderStatus
          muxUploader="bar"
          className="block text-xs text-neutral-400 mt-2"
        />
      </MuxUploader>

      {phase === 'completed' && (
        <div className="space-y-3">
          {/* Preview del video que se acaba de subir */}
          {previewUrl && (
            <div className="rounded-lg overflow-hidden border-4 border-green-500 bg-black">
              <video
                src={previewUrl}
                controls
                playsInline
                className="w-full max-h-96"
              />
            </div>
          )}
          <div className="bg-green-500/20 border-4 border-green-500 rounded-lg p-3">
            <p className="text-green-400 font-bold text-sm">
              ✅ Video subido. Confirma que es el correcto y dale "Enviar".
            </p>
          </div>
        </div>
      )}
    </div>
  );
}