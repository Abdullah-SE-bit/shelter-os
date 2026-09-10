import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, PawPrint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { SidebarContent } from './Sidebar';

export default function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-72 flex-col p-0">
        <SheetHeader className="border-b border-border px-4 py-3">
          <SheetTitle asChild>
            <Link to="/dashboard" className="flex items-center gap-2 font-display text-[15px] font-bold text-foreground" onClick={() => setOpen(false)}>
              <PawPrint className="size-5 text-primary" />
              Shelter OS
            </Link>
          </SheetTitle>
        </SheetHeader>
        <SidebarContent showBrand={false} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
