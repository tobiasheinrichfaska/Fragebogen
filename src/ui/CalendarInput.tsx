// Month view of an absence calendar (Tobias 2026-11-01): one row per week, a tap on a day cycles
// through the field's marks (e.g. Urlaub → krank) and back to empty. Each mark has its colour and
// its first letter, so it reads without colour too.
import {
  calendarEntries,
  cycleDay,
  describeCalendar,
  entriesOutside,
  entryText,
  monthWeeks,
} from '../logic/calendar';
import { formatGermanDate, isIsoMonth, MONTH_NAMES } from '../logic/dates';
import type { FieldDefinition, FieldValue } from '../logic/model';

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

interface Props {
  field: FieldDefinition;
  id: string;
  value: FieldValue | undefined;
  /** `YYYY-MM` from the field named by `monthFrom`; undefined while it is unanswered. */
  month: string | undefined;
  onChoose: (raw: string[]) => void;
}

function letter(label: string): string {
  return label.trim().charAt(0).toLocaleUpperCase('de-DE');
}

export function CalendarInput({ field, id, value, month, onChoose }: Props) {
  const marks = field.options ?? [];
  const entries = calendarEntries(value);
  if (month === undefined || !isIsoMonth(month)) {
    return <p className="muted">Der Kalender erscheint, sobald der Monat angegeben ist.</p>;
  }
  const [year = '', monthNumber = '1'] = month.split('-');
  const markOf = new Map(entries.map((entry) => [entry.date, entry.mark]));
  const outside = entriesOutside(entries, month);
  const choose = (next: typeof entries) => onChoose(next.map(entryText));
  const summary = describeCalendar(value, marks);
  return (
    <div className="calendar">
      <p className="help">
        Tippen Sie auf einen Tag:{' '}
        {marks.map((mark) => `${letter(mark.label)} ${mark.label}`).join(' → ')} → leer.
      </p>
      <table aria-labelledby={`${id}-label`}>
        <caption>
          {MONTH_NAMES[Number(monthNumber) - 1]} {year}
        </caption>
        <thead>
          <tr>
            {WEEKDAYS.map((day) => (
              <th key={day} scope="col">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {monthWeeks(month).map((week, w) => (
            <tr key={w}>
              {week.map((day, d) => {
                if (day === null) return <td key={d} />;
                const mark = markOf.get(day);
                const index = marks.findIndex((candidate) => candidate.id === mark);
                const markLabel = index >= 0 ? marks[index]?.label : undefined;
                return (
                  <td key={d}>
                    <button
                      type="button"
                      className={index >= 0 ? `day mark-${index}` : 'day'}
                      aria-label={`${formatGermanDate(day)}: ${markLabel ?? 'leer'}`}
                      aria-pressed={index >= 0}
                      onClick={() => choose(cycleDay(entries, day, marks))}
                    >
                      <span className="day-number">{Number(day.slice(8))}</span>
                      <span className="day-mark">{markLabel ? letter(markLabel) : ''}</span>
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="calendar-summary" aria-live="polite">
        {summary === '' ? 'Keine Tage markiert.' : summary}
      </p>
      {outside.length > 0 && (
        <div className="banner warning" role="alert">
          <p>
            {outside.length === 1
              ? 'Ein markierter Tag liegt'
              : `${outside.length} markierte Tage liegen`}{' '}
            außerhalb dieses Monats: {describeCalendar(outside.map(entryText), marks)}.
          </p>
          <button
            type="button"
            onClick={() => choose(entries.filter((entry) => entry.date.startsWith(`${month}-`)))}
          >
            Diese Tage entfernen
          </button>
        </div>
      )}
    </div>
  );
}
