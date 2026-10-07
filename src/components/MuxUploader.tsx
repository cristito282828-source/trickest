"use client";

/**
 * Componente de upload de video a Mux con estilo arcade.
 *
 * Flujo (un solo botón "Enviar a Trickest" en el padre):
 *  1. Al montar, pedimos un "direct upload" URL firmado a Mux
 *  2. Usuario selecciona archivo → mostramos preview LOCAL (blob URL)
 *  3. Padre llama ref.current.startUpload() → iniciamos el upload MANUAL con fetch()
 *  4. Upload termina → llamamos onUploaded(uploadId)
 *
 * NO usamos el web component `mux-uploader` para evitar problemas con su
 * auto-upload interno. Hacemos el upload nosotros mismos con fetch.
 */
import {
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
  useRef,
} from 'react';

interface MuxUploaderProps {
  /** Callback cuando el upload termina OK. */
  onUploaded: (data: { uploadId: string }) => void;
  /** Callback cuando el usuario selecciona un archivo (preview listo). */
  onFileSelected?: () => void;
  /** Callback de progreso (0-100). */
  onProgress?: (percent: number) => void;
  /** Callback si falla el upload */
  onError?: (message: string) => void;
}

export interface MuxUploaderHandle {
  /** Inicia el upload del archivo seleccionado. */
  startUpload: () => void;
  /** True si hay un archivo seleccionado y listo para subir. */
  hasFileSelected: () => boolean;
}

const MuxVideoUploader = forwardRef<MuxUploaderHandle, MuxUploaderProps>(
  function MuxVideoUploader({ onUploaded, onFileSelected, onProgress, onError }, ref) {
    const [signedUploadUrl, setSignedUploadUrl] = useState<string>('');
    const [uploadId, setUploadId] = useState<string>('');
    const [phase, setPhase] = useState<'preparing' | 'ready' | 'uploading' | 'completed' | 'error'>('preparing');
    const [errorMsg, setErrorMsg] = useState<string>('');
    const [progress, setProgress] = useState<number>(0);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [fileName, setFileName] = useState<string>('');
    const fileRef = useRef<File | null>(null);

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
        if (previewUrl) URL.revokeObjectURL(previewUrl);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ────────────────────────────────────────────────────────────────
    // Cuando el usuario selecciona un archivo, mostramos preview
    // ────────────────────────────────────────────────────────────────
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Liberar preview previo
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setFileName(file.name);
      fileRef.current = file;
      setProgress(0);
      setPhase('ready'); // listo para upload cuando se llame startUpload
      onFileSelected?.();
    };

    // ────────────────────────────────────────────────────────────────
    // Resetear selección
    // ────────────────────────────────────────────────────────────────
    const handleChangeFile = () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
      setFileName('');
      fileRef.current = null;
      setProgress(0);
    };

    // ────────────────────────────────────────────────────────────────
    // Upload MANUAL con fetch + XHR (para tener progreso)
    // ────────────────────────────────────────────────────────────────
    const uploadWithXHR = (url: string, file: File): Promise<void> => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', url);
        // NO setear Content-Type — Mux firma la URL para un content-type específico
        // Si lo seteamos, el signature falla.

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setProgress(pct);
            onProgress?.(pct);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error durante upload'));
        xhr.send(file);
      });
    };

    // ────────────────────────────────────────────────────────────────
    // Exponer startUpload via ref
    // ────────────────────────────────────────────────────────────────
    useImperativeHandle(ref, () => ({
      startUpload: async () => {
        if (!fileRef.current || !signedUploadUrl || !uploadId) {
          const msg = 'No hay archivo listo o signedUploadUrl no está configurado';
          console.error('[uploader]', msg, {
            hasFile: !!fileRef.current,
            hasUrl: !!signedUploadUrl,
            hasUploadId: !!uploadId,
          });
          onError?.(msg);
          return;
        }

        setPhase('uploading');
        try {
          await uploadWithXHR(signedUploadUrl, fileRef.current);
          setPhase('completed');
          onUploaded({ uploadId });
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Error subiendo';
          console.error('[uploader] upload error:', msg);
          setErrorMsg(msg);
          setPhase('error');
          onError?.(msg);
        }
      },
      hasFileSelected: () => !!fileRef.current,
    }));

    // ────────────────────────────────────────────────────────────────
    // Renders
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
        {/* Si NO hay archivo, mostramos file picker */}
        {!previewUrl && (
          <label
            htmlFor="mux-file-input"
            className="
              group block
              border-4 border-dashed border-neutral-700
              hover:border-accent-cyan-500
              bg-neutral-800/60 hover:bg-neutral-800
              transition-all duration-200
              rounded-lg
              p-5 md:p-10
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
            <input
              id="mux-file-input"
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        )}

        {/* Si hay archivo, mostramos preview + estado */}
        {previewUrl && (
          <div className="space-y-3">
            <div className="rounded-lg overflow-hidden border-4 border-accent-cyan-500 bg-black">
              {phase === 'uploading' ? (
                <div className="aspect-video flex flex-col items-center justify-center p-6 gap-3">
                  <div className="text-5xl animate-pulse">⏫</div>
                  <p className="text-accent-cyan-400 font-bold uppercase text-sm">
                    Subiendo a Trickest... {progress}%
                  </p>
                  <div className="w-full max-w-md bg-neutral-800 rounded-full h-3 overflow-hidden border-2 border-neutral-700">
                    <div
                      className="h-full bg-gradient-to-r from-accent-cyan-500 to-accent-purple-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <video
                  src={previewUrl}
                  controls
                  playsInline
                  className="w-full max-h-40 md:max-h-96"
                />
              )}
            </div>

            <div className="flex items-center justify-between gap-2 bg-neutral-800 border-2 border-neutral-700 rounded-lg px-3 py-2">
              <p className="text-xs text-neutral-300 truncate flex-1">
                📁 <span className="font-bold">{fileName}</span>
              </p>
              {phase !== 'uploading' && (
                <button
                  type="button"
                  onClick={handleChangeFile}
                  className="text-xs text-neutral-400 hover:text-red-400 uppercase font-bold whitespace-nowrap"
                >
                  ✕ Cambiar
                </button>
              )}
            </div>

            {phase === 'ready' && (
              <p className="text-xs text-neutral-500 text-center">
                Confirma el video y dale "Enviar" abajo para mandar a evaluación.
              </p>
            )}

            {phase === 'completed' && (
              <div className="bg-green-500/20 border-4 border-green-500 rounded-lg p-3">
                <p className="text-green-400 font-bold text-sm">
                  ✅ Video subido. Confirma y dale "Enviar".
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

export default MuxVideoUploader;