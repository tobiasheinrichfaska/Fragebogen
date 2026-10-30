// One input per field type. Text-like fields keep the typed text locally and hand it over on
// "Weiter" (normalising every keystroke would fight the person); choices answer immediately.
import type { FieldDefinition, FieldType, FieldValue } from '../logic/model';
import { optionsOf } from '../logic/options';
import { isTextLike } from './fieldKinds';

const INPUT_MODE: Partial<Record<FieldType, 'numeric' | 'decimal' | 'text'>> = {
  date: 'numeric',
  taxId: 'numeric',
  betriebsnummer: 'numeric',
  money: 'decimal',
  number: 'decimal',
  month: 'decimal',
};

const PLACEHOLDER: Partial<Record<FieldType, string>> = {
  date: 'TT.MM.JJJJ',
  money: '0,00',
  month: 'MM.JJJJ',
  iban: 'DE00 0000 0000 0000 0000 00',
};

function numberPlaceholder(field: FieldDefinition): string {
  const decimals = field.decimals ?? 0;
  return decimals === 0 ? '0' : `0,${'0'.repeat(decimals)}`;
}

interface Props {
  field: FieldDefinition;
  id: string;
  value: FieldValue | undefined;
  text: string;
  onText: (text: string) => void;
  onChoose: (raw: unknown) => void;
  onSubmit: () => void;
}

export function FieldInput({ field, id, value, text, onText, onChoose, onSubmit }: Props) {
  if (field.type === 'boolean') {
    return (
      <div className="choices choices-inline" role="radiogroup" aria-labelledby={`${id}-label`}>
        {[
          { label: 'Ja', raw: true },
          { label: 'Nein', raw: false },
        ].map((option) => (
          <button
            key={option.label}
            type="button"
            role="radio"
            aria-checked={value === option.raw}
            className={value === option.raw ? 'choice chosen' : 'choice'}
            onClick={() => onChoose(option.raw)}
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  }
  if (field.type === 'choice' && field.optionsFrom !== undefined) {
    const listId = `${id}-list`;
    return (
      <>
        <input
          id={id}
          type="text"
          value={text}
          list={listId}
          autoComplete="off"
          spellCheck={false}
          aria-labelledby={`${id}-label`}
          placeholder="Tippen und aus der Liste wählen"
          onChange={(event) => onText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') onSubmit();
          }}
        />
        <datalist id={listId}>
          {optionsOf(field).map((option) => (
            <option key={option.id} value={option.label} />
          ))}
        </datalist>
      </>
    );
  }
  if (field.type === 'choice') {
    return (
      <div className="choices" role="radiogroup" aria-labelledby={`${id}-label`}>
        {(field.options ?? []).map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={value === option.id}
            className={value === option.id ? 'choice chosen' : 'choice'}
            onClick={() => onChoose(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  }
  if (field.type === 'multiChoice') {
    const chosen = new Set(Array.isArray(value) ? value.map(String) : []);
    return (
      <div className="choices" role="group" aria-labelledby={`${id}-label`}>
        {(field.options ?? []).map((option) => (
          <label key={option.id} className={chosen.has(option.id) ? 'choice chosen' : 'choice'}>
            <input
              type="checkbox"
              checked={chosen.has(option.id)}
              onChange={(event) => {
                const next = new Set(chosen);
                if (event.target.checked) next.add(option.id);
                else next.delete(option.id);
                onChoose([...next]);
              }}
            />
            {option.label}
          </label>
        ))}
      </div>
    );
  }
  if (!isTextLike(field)) {
    return <p className="muted">Dieser Feldtyp wird noch nicht unterstützt.</p>;
  }
  const common = {
    id,
    value: text,
    autoComplete: 'off',
    spellCheck: false,
    autoCorrect: 'off',
    'aria-labelledby': `${id}-label`,
    onChange: (event: { target: { value: string } }) => onText(event.target.value),
  };
  if (field.multiline) return <textarea {...common} rows={4} />;
  return (
    <input
      {...common}
      type="text"
      inputMode={
        field.type === 'number' && field.signed ? 'text' : (INPUT_MODE[field.type] ?? 'text')
      }
      placeholder={field.type === 'number' ? numberPlaceholder(field) : PLACEHOLDER[field.type]}
      autoCapitalize={
        field.type === 'iban' || field.type === 'svNumber' ? 'characters' : 'sentences'
      }
      onKeyDown={(event) => {
        if (event.key === 'Enter') onSubmit();
      }}
    />
  );
}
