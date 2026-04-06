import Link from "next/link";

export function TopNav() {
  return (
    <header
      style={{
        borderBottom: "1px solid var(--line)",
        background:
          "linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(236,253,250,0.9) 100%)"
      }}
    >
      <div
        className="container"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <Link href="/" style={{ fontWeight: 700 }}>
          Resume Builder
        </Link>
        <nav className="row">
          <Link href="/dashboard" className="muted">
            Dashboard
          </Link>
          <Link href="/resume/new" className="button">
            New Resume
          </Link>
        </nav>
      </div>
    </header>
  );
}
