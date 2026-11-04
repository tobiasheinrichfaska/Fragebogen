// A date or month typed as digits: the mask shows the dots before they are typed (rules in
// logic/typing.ts). A date can also be picked with the device's own date picker — on the iPhone
// a tap on the month shows wheels for month and year. The picker input lies invisibly over the
// calendar button, so a tap opens it on every phone; desktop browsers open it via showPicker().
import type { ReactNode } from 'react';
import type { FieldDefinition } from '../logic/model';
import { fromPicker, maskRest, pickerBounds, pickerValue } from '../logic/typing';

interface Props {
  field: FieldDefinition;
  text: string;
  onText: (text: string) => void;
  /** The text input itself. */
  children: ReactNode;
}

export function DateEntry({ field, text, onText, children }: Props) {
  const rest = maskRest(field.type, text);
  const bounds = pickerBounds(field);
  return (
    <div className="date-entry">
      <div className="masked">
        {children}
        {rest ? (
          <span className="mask" aria-hidden="true">
            <span className="mask-typed">{text}</span>
            {rest}
          </span>
        ) : null}
      </div>
      {field.type === 'date' ? (
        <label className="date-pick" title="Im Kalender wählen">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
            <path d="M3.5 10h17M8 3v4M16 3v4" />
          </svg>
          <input
            type="date"
            tabIndex={-1}
            aria-label="Datum im Kalender wählen"
            value={pickerValue(text)}
            min={bounds.min}
            max={bounds.max}
            onClick={(event) => {
              try {
                event.currentTarget.showPicker();
              } catch {
                // the tap itself opens it (phones), or the browser refuses (frame) — fine either way
              }
            }}
            onChange={(event) => {
              // Empty while a desktop picker is half edited: keep the typed text then.
              const picked = fromPicker(event.target.value);
              if (picked !== '') onText(picked);
            }}
          />
        </label>
      ) : null}
    </div>
  );
}
