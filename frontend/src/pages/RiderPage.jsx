import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Input } from "../components/Input";

export function RiderPage() {
  return (
    <Card accent="blue">
      <div className="card-icon">R</div>
      <p className="eyebrow blue-text">Rider</p>
      <h2>Request a ride</h2>
      <p className="muted">Set pickup and destination, then match with a nearby driver.</p>
      <form className="stack">
        <Input label="Pickup" placeholder="Lekki Phase 1" />
        <Input label="Drop-off" placeholder="Victoria Island" />
        <Button type="button">Request ride</Button>
      </form>
    </Card>
  );
}
