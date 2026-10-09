import { Button } from "../components/Button";
import { Card } from "../components/Card";

export function DriverPage() {
  return (
    <Card accent="green">
      <div className="card-icon">D</div>
      <p className="eyebrow green-text">Driver</p>
      <h2>Accept ride requests</h2>
      <p className="muted">Go online to receive ride requests and update each trip status.</p>
      <div className="metric-row">
        <span>Today</span>
        <strong>NGN 0 earned</strong>
      </div>
      <Button type="button" variant="success">Go online</Button>
    </Card>
  );
}
