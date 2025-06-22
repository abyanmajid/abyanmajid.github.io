import { useEffect } from "react";

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmModal({
  open,
  title = "Confirm",
  message,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  // focus close button or something when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        const btn = document.querySelector<HTMLButtonElement>(
          'dialog.confirm-dialog button[aria-label="Close"]'
        );
        btn?.focus();
      }, 0);
    }
  }, [open]);

  if (!open) return null;
  return (
    <dialog className="confirm-dialog" open>
      <article>
        <header>
          <button aria-label="Close" rel="prev" onClick={onCancel}></button>
          <p>
            <strong>{title}</strong>
          </p>
        </header>
        <div>
          <p>{message}</p>
        </div>
        <footer
          style={{
            marginTop: "1rem",
            display: "flex",
            gap: "0.5rem",
            justifyContent: "flex-end",
          }}
        >
          <button className="outline secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="outline" onClick={onConfirm}>
            OK
          </button>
        </footer>
      </article>
    </dialog>
  );
}
