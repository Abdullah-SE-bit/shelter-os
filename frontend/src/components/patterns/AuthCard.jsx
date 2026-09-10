export default function AuthCard({ children, className = '' }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <div className={`w-full max-w-[440px] rounded-2xl border border-border bg-card p-10 shadow-lg ${className}`}>
        {children}
      </div>
    </div>
  );
}
