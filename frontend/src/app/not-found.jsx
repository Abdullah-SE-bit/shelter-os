import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
      <p className="text-sm text-muted-foreground">The page you're looking for doesn't exist.</p>
      <Link href="/adoption" className="mt-2 text-sm font-semibold text-primary hover:underline">
        Back to Shelter OS
      </Link>
    </div>
  );
}
