// One input per field type. Text-like fields keep the typed text locally and hand it over on
// "Weiter" (normalising every keystroke would fight the person); choices answer immediately.
import { answerSuggestions } from '../logic/answerSuggestions';
import type { PartData } from '../logic/form';
import type {
  ChoiceOption,
  FieldDefinition,
  FieldType,
  FieldValue,
  FormDefinition,
} from '../logic/model';
import { stepHalfSteps } from '../logic/normalize';
import { TYPED_MASKS, typedText } from '../logic/typing';
import { ISSUE_MESSAGES } from '../logic/issues';
import {
  listOptionFor,
  listValidityOf,
  optionsOf,
  searchWordsOf,
  REFERENCE_LISTS,
  suggestionsOf,
  validityNote,
} from '../logic/options';
import { CalendarInput } from './CalendarInput';
import { DateEntry } from './DateEntry';
import { INPUT_MODE, isTextLike } from './fieldKinds';
import { SearchSelect } from './SearchSelect';

// Dates and months show their mask instead (logic/typing.ts); it stays the placeholder for screen readers.
const PLACEHOLDER: Partial<Record<FieldType, string>> = {
  ...TYPED_MASKS,
  money: '0,00',
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
  /** The form and the role's answers so far: a calendar's month, suggestions from answers. */
  context?: { definition: FormDefinition; data: PartData };
  /** The answers offered now (optionConditions.ts); all options of the field without it. */
  options?: readonly ChoiceOption[];
}

export function FieldInput({
  field,
  id,
  value,
  text,
  onText,
  onChoose,
  onSubmit,
  context,
  options,
}: Props) {
  if (field.type === 'calendar') {
    const month = field.monthFrom === undefined ? undefined : context?.data[field.monthFrom];
    return (
      <CalendarInput
        field={field}
        id={id}
        value={value}
        month={typeof month === 'string' ? month : undefined}
        onChoose={onChoose}
      />
    );
  }
  if (
    field.type === 'text' &&
    field.suggestionsFrom !== undefined &&
    !REFERENCE_LISTS[field.suggestionsFrom]
  ) {
    // Offered from earlier answers (e.g. the employees, the Lohnarten); any other text is fine.
    const offered = context ? answerSuggestions(context.definition, field, context.data) : [];
    return (
      <SearchSelect
        id={id}
        options={offered.map((label) => ({ value: label, label }))}
        text={text}
        onText={onText}
        onPick={(option) => onText(option.label)}
        onSubmit={onSubmit}
        placeholder="Tippen oder aus der Liste wählen"
        labelledBy={`${id}-label`}
      />
    );
  }
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
  if (field.type === 'text' && field.suggestionsFrom !== undefined) {
    const listId = field.suggestionsFrom;
    const options = suggestionsOf(field);
    const typed = text.trim();
    // Free text is allowed; the hint shows at once, before "Weiter".
    const free = typed !== '' && listOptionFor(options, typed) === undefined;
    return (
      <>
        <SearchSelect
          id={id}
          options={options.map((option) => ({
            value: option.id,
            label: option.label,
            keywords: searchWordsOf(listId, option.id),
          }))}
          text={text}
          onText={onText}
          onPick={(option) => onText(option.label)}
          onSubmit={onSubmit}
          show={(option) => {
            const note = validityNote(listValidityOf(listId, option.value));
            return note ? `${option.label} (${note})` : option.label;
          }}
          placeholder="Tippen und aus der Liste wählen"
          labelledBy={`${id}-label`}
        />
        {free && <p className="warning-text">{ISSUE_MESSAGES['list.freeEntry']}</p>}
      </>
    );
  }
  if (field.type === 'choice' && field.optionsFrom !== undefined) {
    // The chosen label goes into the box; "Weiter" maps it to the entry (listOptionFor).
    return (
      <SearchSelect
        id={id}
        options={optionsOf(field).map((option) => ({ value: option.id, label: option.label }))}
        text={text}
        onText={onText}
        onPick={(option) => onText(option.label)}
        onSubmit={onSubmit}
        placeholder="Tippen und aus der Liste wählen"
        labelledBy={`${id}-label`}
      />
    );
  }
  if (field.type === 'choice') {
    return (
      <div className="choices" role="radiogroup" aria-labelledby={`${id}-label`}>
        {(options ?? field.options ?? []).map((option) => (
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
        {(options ?? field.options ?? []).map((option) => (
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
    // The length limit is enforced while typing; normalisation refuses longer text from elsewhere.
    ...(field.maxLength === undefined ? {} : { maxLength: field.maxLength }),
    onChange: (event: { target: { value: string } }) =>
      onText(typedText(field.type, event.target.value)),
  };
  if (field.multiline) return <textarea {...common} rows={4} />;
  if (field.textFormat === 'halbeSchritte') {
    return (
      <div className="stepper">
        <button
          type="button"
          aria-label="0,5 weniger"
          onClick={() => onText(stepHalfSteps(text, -1))}
        >
          −
        </button>
        <input
          {...common}
          type="text"
          inputMode="decimal"
          // No grey „0“: it read like an answer while „Weiter“ stayed locked (Chrome evaluation
          // 2026-11-13, B2).
          onKeyDown={(event) => {
            if (event.key === 'Enter') onSubmit();
          }}
        />
        <button type="button" aria-label="0,5 mehr" onClick={() => onText(stepHalfSteps(text, 1))}>
          +
        </button>
      </div>
    );
  }
  const input = (
    <input
      {...common}
      type="text"
      inputMode={
        field.textFormat === 'telefon'
          ? 'tel'
          : field.textFormat === 'email'
            ? 'email'
            : field.type === 'number' && field.signed
              ? 'text'
              : (INPUT_MODE[field.type] ?? 'text')
      }
      placeholder={field.type === 'number' ? numberPlaceholder(field) : PLACEHOLDER[field.type]}
      autoCapitalize={
        field.type === 'iban' || field.type === 'svNumber'
          ? 'characters'
          : field.textFormat === 'email'
            ? 'none'
            : 'sentences'
      }
      onKeyDown={(event) => {
        if (event.key === 'Enter') onSubmit();
      }}
    />
  );
  if (TYPED_MASKS[field.type] === undefined) return input;
  return (
    <DateEntry field={field} text={text} onText={onText}>
      {input}
    </DateEntry>
  );
}
