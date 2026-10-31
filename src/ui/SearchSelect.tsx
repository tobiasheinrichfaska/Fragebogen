// Pick list with search: what is typed filters the list (every word must appear), arrow keys and
// Enter choose, a click chooses. Same behaviour in every browser (a <datalist> filters differently
// per engine and barely works on iOS). Filtering is pure (filterOptions in the logic layer).
import { useId, useState } from 'react';
import { filterOptions } from '../logic/options';

export interface SearchOption {
  value: string;
  label: string;
  /** Extra search words, not shown (e.g. "TK"). */
  keywords?: string;
}

interface Props {
  id?: string;
  options: readonly SearchOption[];
  /** Text in the box (the caller keeps it, e.g. until "Weiter"). */
  text: string;
  onText: (text: string) => void;
  onPick: (option: SearchOption) => void;
  /** Enter while the list is closed. */
  onSubmit?: () => void;
  /** How an entry reads in the list, e.g. "ib – Israelitische …". */
  show?: (option: SearchOption) => string;
  placeholder?: string;
  labelledBy?: string;
}

export function SearchSelect({
  id,
  options,
  text,
  onText,
  onPick,
  onSubmit,
  show = (option) => option.label,
  placeholder = 'Tippen, um die Liste zu filtern',
  labelledBy,
}: Props) {
  const own = useId();
  const listId = `${id ?? own}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const { shown, more } = filterOptions(options, text);
  const pick = (option: SearchOption | undefined) => {
    if (!option) return;
    onPick(option);
    setOpen(false);
  };
  return (
    <div className="search-select">
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && shown[active] ? `${listId}-${active}` : undefined}
        aria-labelledby={labelledBy}
        value={text}
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onChange={(event) => {
          onText(event.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setOpen(true);
            setActive(Math.min(active + 1, shown.length - 1));
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActive(Math.max(active - 1, 0));
          } else if (event.key === 'Escape') {
            setOpen(false);
          } else if (event.key === 'Enter') {
            event.preventDefault();
            if (open && shown.length > 0) pick(shown[active]);
            else onSubmit?.();
          }
        }}
      />
      {open && (
        <ul id={listId} role="listbox" className="search-list">
          {shown.map((option, i) => (
            <li
              key={option.value}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className={i === active ? 'active' : undefined}
              // mousedown keeps the focus in the box, so blur does not close the list first
              onMouseDown={(event) => {
                event.preventDefault();
                pick(option);
              }}
            >
              {show(option)}
            </li>
          ))}
          {shown.length === 0 && <li className="muted">Kein Eintrag passt.</li>}
          {more > 0 && <li className="muted">… {more} weitere – bitte genauer tippen</li>}
        </ul>
      )}
    </div>
  );
}
