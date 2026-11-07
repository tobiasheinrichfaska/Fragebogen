// A question of the test page (Tobias 2026-11-07): restart the app for the test just opened, reset it,
// which tests go into the report. A modal <dialog> instead of the browser's confirm(), which a browser
// may suppress; Esc closes it like the first choice "so lassen" / "Abbrechen".
import { useEffect, useRef } from 'react';

export interface Choice {
  label: string;
  primary?: boolean;
  onChoose?: () => void;
}

export interface Question {
  title: string;
  text: readonly string[];
  /** Left to right; a choice without onChoose only closes the question. */
  choices: readonly Choice[];
}

export function ChoiceDialog({ question, onClose }: { question: Question; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="choice-dialog"
      aria-labelledby="test-question-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <h2 id="test-question-title">{question.title}</h2>
      {question.text.map((text) => (
        <p key={text}>{text}</p>
      ))}
      <div className="choice-dialog-buttons">
        {question.choices.map((choice) => (
          <button
            key={choice.label}
            type="button"
            className={choice.primary ? 'primary' : undefined}
            autoFocus={choice.primary}
            onClick={() => {
              onClose();
              choice.onChoose?.();
            }}
          >
            {choice.label}
          </button>
        ))}
      </div>
    </dialog>
  );
}
