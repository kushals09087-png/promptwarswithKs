import Link from "next/link";

export default function NotFound() {
  return (
    <main className="shell">
      <h1>Page not found</h1>
      <p className="muted">The requested LabLink Nexus page does not exist.</p>
      <Link className="button" href="/">Return home</Link>
    </main>
  );
}
