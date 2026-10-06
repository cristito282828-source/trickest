"use client";

/**
 * Componente de upload de video a Mux con estilo arcade.
 *
 * Flujo:
 *  1. Usuario selecciona/suelta un archivo
 *  2. Pedimos al server un "direct upload" (URL firmada)
 *  3. El browser sube directo a Mux (no pasa por nuestro server)
 *  4. Al terminar, llamamos onUploaded(uploadId, assetId) para que el padre
 *     haga el POST /api/submissions con esos IDs.
 *
 * Wraps @mux/mux-uploader-react con nuestro tema (gradientes, bordes 4px, etc.)
 */
import { useState, useRef } from 'react';
import MuxUploader, { MuxUploaderDrop, MuxUploaderFileSelect, MuxUploaderProgress, MuxUploaderStatus } from '@mux/mux-uploader-react';

interface MuxUploaderProps {
  /** Callback cuando el upload termina OK. El padre usa estos IDs para crear la Submission. */
  onUploaded: (data: { uploadId: string; assetId?: string }) => void;
  /** Callback si falla el upload */
  onError?: (message: string) => void;
}

export default function MuxVideoUploader({ onUploaded, onError }: MuxUploaderProps) {
  const [status, setStatus] = useState<'idle' | 'preparing' | 'uploading' | 'completed' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const uploadUrlRef = useRef<string>('');

  /**
   * Se ejecuta cuando el usuario selecciona un archivo. Antes de subir,
   * pedimos al server un "direct upload" (URL firmada de Mux).
   */
  const handleUploadStart = async () => {
    try {
      setStatus('preparing');
      setErrorMsg('');

      const res = await fetch('/api/uploads', { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error creando upload' }));
        throw new Error(err.error || 'Error creando upload');
      }

      const { uploadId, uploadUrl } = await res.json();
      uploadUrlRef.current = uploadUrl;

      // El endpoint del MuxUploader se setea por atributo `endpoint`
      // MuxUploader lee esta URL y sube directo a Mux desde el browser.
      const uploaderEl = document.querySelector('mux-uploader') as any;
      if (uploaderEl) {
        uploaderEl.endpoint = uploadUrl;
      }

      setStatus('uploading');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setErrorMsg(msg);
      setStatus('error');
      onError?.(msg);
    }
  };

  /**
   * Se ejecuta cuando el upload a Mux termina OK.
   * El "uploadId" lo podemos extraer del atributo data o del input hidden.
   */
  const handleSuccess = (event: any) => {
    setStatus('completed');
    // muxUploader emite el upload_id en el detalle del evento
    const uploadId = event.detail?.upload_id || '';
    onUploaded({ uploadId });
  };

  return (
    <div className="space-y-3">
      {/* Contenedor con estilo arcade (bordes 4px, darkBg, gradiente en hover) */}
      <MuxUploader
        endpoint=""
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

      {/* Error message */}
      {status === 'error' && errorMsg && (
        <div className="bg-red-500/20 border-4 border-red-500 rounded-lg p-3">
          <p className="text-red-400 font-bold text-sm">❌ {errorMsg}</p>
        </div>
      )}

      {/* Success hint */}
      {status === 'completed' && (
        <div className="bg-green-500/20 border-4 border-green-500 rounded-lg p-3">
          <p className="text-green-400 font-bold text-sm">✅ Video subido. Click "Enviar" para terminar.</p>
        </div>
      )}
    </div>
  );
}