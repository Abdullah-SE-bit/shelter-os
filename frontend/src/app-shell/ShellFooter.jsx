export default function ShellFooter() {
  return (
    <footer className="border-t border-border px-6 py-3">
      <p className="text-xs text-muted-foreground">
        Shelter OS &middot; {new Date().getFullYear()} &middot; built for animal shelters, vets, employees, and adopters
      </p>
    </footer>
  );
}
