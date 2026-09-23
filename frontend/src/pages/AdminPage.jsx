import { Button } from "../components/Button";
import { Card } from "../components/Card";

export function AdminPage() {
  return (
    <Card accent="orange">
      <div className="card-icon">A</div>
      <p className="eyebrow">Admin</p>
      <h2>Monitor activity</h2>
      <p className="muted">Track active rides, verify drivers, and review platform analytics.</p>
      <div className="metric-grid">
        <div><strong>0</strong><span>rides</span></div>
        <div><strong>0</strong><span>drivers</span></div>
      </div>
      <Button type="button" variant="warm">Open dashboard</Button>
    </Card>
  );
}
