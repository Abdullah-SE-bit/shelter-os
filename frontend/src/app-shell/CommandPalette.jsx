import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getNavSections, quickActions } from './navConfig';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';

/**
 * Ctrl/Cmd+K quick navigation. This wave wires it to the same role-aware
 * nav config that drives the Sidebar plus role-gated quick actions — a
 * fast, no-network jump-to-anything. Fanning out to live API search
 * (cats/shelters/users/donations/audit) is a Wave 5 enhancement layered
 * on top of this same dialog, not a replacement for it.
 */
export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    function onKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const navItems = useMemo(() => {
    if (!user) return [];
    return getNavSections(user.role).flatMap((sec) =>
      sec.items.map((item) => ({ ...item, section: sec.section })),
    );
  }, [user]);

  const actions = useMemo(
    () => quickActions.filter((a) => user && a.roles.includes(user.role)),
    [user],
  );

  const go = (path) => {
    setOpen(false);
    navigate(path);
  };

  if (!user) return null;

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Quick navigation" description="Jump to any page or action">
      <CommandInput placeholder="Search pages and actions…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {actions.length > 0 && (
          <CommandGroup heading="Quick actions">
            {actions.map((a) => (
              <CommandItem key={a.path} value={`action ${a.label}`} onSelect={() => go(a.path)}>
                <Zap className="text-primary" />
                {a.label}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        <CommandSeparator />
        <CommandGroup heading="Navigate">
          {navItems.map((item) => (
            <CommandItem key={item.path} value={`${item.section || ''} ${item.label}`} onSelect={() => go(item.path)}>
              <item.icon />
              {item.label}
              <ArrowRight className="ml-auto size-3.5 opacity-40" />
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
