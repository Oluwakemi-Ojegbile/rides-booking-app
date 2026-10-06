import { Button } from "./Button";
import { Input } from "./Input";

export function ConfirmCancelDialog({ open, reason, onReasonChange, onConfirm, onClose, busy }) {
  if (!open) return null;

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="cancel-ride-title">
        <h2 id="cancel-ride-title">Cancel this ride?</h2>
        <p className="muted">This action cannot be undone. The other participant will be notified.</p>
        <Input label="Reason (optional)" value={reason} onChange={(event) => onReasonChange(event.target.value)} />
        <div className="dialog-actions">
          <Button type="button" variant="secondary" disabled={busy} onClick={onClose}>Keep ride</Button>
          <Button type="button" variant="danger" disabled={busy} onClick={onConfirm}>
            {busy ? "Cancelling..." : "Cancel ride"}
          </Button>
        </div>
      </section>
    </div>
  );
}
