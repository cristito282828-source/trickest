"use client";

/**
 * Componente de upload de video a Mux con estilo arcade.
 *
 * Flujo híbrido (preview antes de subir):
 *  1. Al montar, pedimos un "direct upload" URL firmado a Mux
 *  2. Usuario selecciona archivo → mostramos preview LOCAL (blob URL)
 *  3. Usuario confirma con "Subir a Trickest" → iniciamos el upload
 *  4. Upload termina → llamamos onUploaded(uploadId)
 *
 * Esto evita gastar bandwidth si el usuario se equivoca de archivo.
 * El preview es 100% local (blob URL) → no le cuesta nada a tu server ni a Mux.
 */
import { useState, useEffect, useRef } from 'react';
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

type Phase =
  | 'preparing'      // fetching upload URL
  | 'ready'          // URL ready, waiting for file selection
  | 'selected'       // file selected, preview shown, waiting for "Subir" click
  | 'uploading'      // uploading to Mux
  | 'completed'      // done, ready to submit
  | 'error';

export default function MuxVideoUploader({ onUploaded, onError }: MuxUploaderProps) {
  const [signedUploadUrl, setSignedUploadUrl] = useState<string>(''); // URL de Mux para el PUT
  const [uploadId, setUploadId] = useState<string>('');
  // `activeEndpoint` es lo que pasamos al MuxUploader. Solo lo seteamos cuando el usuario confirma.
  // Mientras está vacío, MuxUploader no puede subir aunque tenga un archivo seleccionado.
  const [activeEndpoint, setActiveEndpoint] = useState<string>('');
  const [phase, setPhase] = useState<Phase>('preparing');
  const [errorMsg, setErrorMsg] = useState<string>('');
  // Blob URL para preview local (FREE — no cuesta bandwidth de Mux)
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const uploaderRef = useRef<any>(null);

  // ────────────────────────────────────────────────────────────────
  // Fetch upload URL al montar (solo una vez)
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
        const { uploadUrl, uploadId } = await res.json();
        if (!cancelled) {
          setSignedUploadUrl(uploadUrl);
          setUploadId(uploadId);
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
      // Liberar blob URL si existe
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Adjuntamos el listener al elemento nativo cuando el ref cambia
  useEffect(() => {
    const el = uploaderRef.current;
    if (!el) return;

    const onFileReady = (event: any) => {
      try {
        const file: File | undefined = event.detail;
        if (file) {
          handleFile(file);
          return;
        }
        // fallback — sacar del input del elemento
        const fileInput = el.querySelector('input[type="file"]') as HTMLInputElement;
        const f = fileInput?.files?.[0];
        if (f) handleFile(f);
      } catch (e) {
        console.warn('[uploader] Error en file-ready:', e);
      }
    };

    el.addEventListener('file-ready', onFileReady as EventListener);
    return () => {
      el.removeEventListener('file-ready', onFileReady as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ────────────────────────────────────────────────────────────────
  // Cuando el usuario selecciona un archivo, mostramos preview.
  // NO iniciamos upload — esperamos a que confirme con "Subir".
  // ────────────────────────────────────────────────────────────────
  const handleFile = (file: File) => {
    // Liberar preview previo
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    // Crear nuevo blob URL (gratis, es local)
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setFileName(file.name);
    setPhase('selected');
  };

  // ────────────────────────────────────────────────────────────────
  // El usuario confirma → iniciamos el upload seteando el endpoint
  // ────────────────────────────────────────────────────────────────
  const handleStartUpload = () => {
    setActiveEndpoint(signedUploadUrl);
    setPhase('uploading');
  };

  // ────────────────────────────────────────────────────────────────
  // Upload terminó OK
  // ────────────────────────────────────────────────────────────────
  const handleSuccess = () => {
    setPhase('completed');
    if (uploadId) {
      onUploaded({ uploadId });
    } else {
      console.error('[uploader] No tenemos uploadId a pesar de success event.');
      onError?.('Error: no se pudo obtener el ID del upload. Vuelve a intentar.');
    }
  };

  const handleUploadStart = () => {
    setPhase('uploading');
  };

  // ────────────────────────────────────────────────────────────────
  // Cambiar de archivo (reset al estado "ready")
  // ────────────────────────────────────────────────────────────────
  const handleChangeFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    setFileName('');
    setActiveEndpoint('');
    setPhase('ready');
    // Resetear el input file del web component
    const uploaderEl = uploaderRef.current;
    const fileInput = uploaderEl?.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  // ────────────────────────────────────────────────────────────────
  // Renders por estado
  // ────────────────────────────────────────────────────────────────

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
      {/* MuxUploader siempre montado (necesario para su state interno), pero oculto en selected/completed */}
      {(phase === 'ready' || phase === 'uploading') && (
        <MuxUploader
          ref={uploaderRef}
          endpoint={activeEndpoint}
          type="bar"
          noDrop={false}
          onUploadStart={handleUploadStart}
          onSuccess={handleSuccess}
          className="block w-full"
        >
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

          <MuxUploaderFileSelect muxUploader="bar" className="hidden">
            <button type="button">Select file</button>
          </MuxUploaderFileSelect>

          {phase === 'uploading' && (
            <>
              <MuxUploaderProgress
                muxUploader="bar"
                className="
                  block text-sm bg-neutral-900 border-4 border-accent-cyan-500
                  rounded-lg mt-3 h-3
                  [&::part(bar)]:bg-gradient-to-r
                  [&::part(bar)]:from-accent-cyan-500
                  [&::part(bar)]:to-accent-purple-500
                "
              />
              <MuxUploaderStatus muxUploader="bar" className="block text-xs text-neutral-400 mt-2" />
            </>
          )}
        </MuxUploader>
      )}

      {/* ── FASE: selected — preview + botón "Subir" ── */}
      {phase === 'selected' && previewUrl && (
        <div className="space-y-3">
          <div className="rounded-lg overflow-hidden border-4 border-accent-cyan-500 bg-black">
            <video
              src={previewUrl}
              controls
              playsInline
              className="w-full max-h-96"
            />
          </div>

          <div className="flex items-center justify-between gap-2 bg-neutral-800 border-2 border-neutral-700 rounded-lg px-3 py-2">
            <p className="text-xs text-neutral-300 truncate flex-1">
              📁 <span className="font-bold">{fileName}</span>
            </p>
            <button
              type="button"
              onClick={handleChangeFile}
              className="text-xs text-neutral-400 hover:text-red-400 uppercase font-bold whitespace-nowrap"
            >
              ✕ Cambiar
            </button>
          </div>

          <button
            type="button"
            onClick={handleStartUpload}
            className="
              w-full bg-accent-cyan-500 hover:bg-accent-cyan-600
              text-black font-bold py-3 px-6
              rounded-lg uppercase tracking-wider transition-all
              border-4 border-white/20 shadow-lg shadow-accent-cyan-500/50
            "
          >
            🚀 Subir a Trickest
          </button>

          <p className="text-xs text-neutral-500 text-center">
            El video se subirá a Mux y se procesará. Esto puede tardar unos segundos.
          </p>
        </div>
      )}

      {/* ── FASE: completed — preview + confirmación ── */}
      {phase === 'completed' && previewUrl && (
        <div className="space-y-3">
          <div className="rounded-lg overflow-hidden border-4 border-green-500 bg-black">
            <video
              src={previewUrl}
              controls
              playsInline
              className="w-full max-h-96"
            />
          </div>
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