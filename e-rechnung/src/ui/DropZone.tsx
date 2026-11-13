import { useRef, useState } from 'react';
import type { DragEvent } from 'react';

interface Props {
  onFile: (file: File) => void;
  disabled?: boolean;
}

/** Drop a file or pick one; only the first file of a drop counts. */
export function DropZone({ onFile, disabled = false }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const take = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onFile(file);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setOver(false);
    if (!disabled) take(event.dataTransfer.files);
  };

  return (
    <div
      className={`dropzone${over ? ' over' : ''}`}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
    >
      <p className="dropzone-title">Rechnung hierher ziehen</p>
      <p className="dropzone-sub">PDF oder XML. Die Datei bleibt auf Ihrem Rechner.</p>
      <button
        type="button"
        className="primary"
        disabled={disabled}
        onClick={() => input.current?.click()}
      >
        Datei auswählen
      </button>
      <input
        ref={input}
        type="file"
        accept=".pdf,.xml,application/pdf,application/xml,text/xml"
        hidden
        data-testid="file-input"
        onChange={(event) => {
          take(event.target.files);
          event.target.value = '';
        }}
      />
    </div>
  );
}
