export function Card({ children, accent = "blue", className = "" }) {
  return <section className={`card card-${accent} ${className}`}>{children}</section>;
}
