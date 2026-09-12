'use client';

import { useRouter } from 'next/navigation';
import { LogOut, Settings, UserRound } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin',
  SHELTER_ADMIN: 'Shelter Admin',
  VET: 'Veterinarian',
  EMPLOYEE: 'Employee',
  PET_OWNER: 'Pet Owner',
  ADOPTER: 'Adopter',
  GUEST: 'Guest',
};

export default function ProfileMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;
  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  const name = user.profile?.first_name
    ? `${user.profile.first_name} ${user.profile.last_name || ''}`.trim()
    : user.email;
  const initial = (user.profile?.first_name?.[0] || user.email?.[0] || '?').toUpperCase();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar>
          <AvatarImage src={user.profile?.profile_photo_url} alt="" />
          <AvatarFallback className="bg-primary text-primary-foreground">{initial}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span className="truncate text-sm font-semibold text-foreground">{name}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {ROLE_LABELS[user.role] || user.role}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {!isSuperAdmin && (
          <>
            <DropdownMenuItem onSelect={() => router.push('/profile')}>
              <UserRound className="size-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => router.push('/profile/edit')}>
              <Settings className="size-4" />
              Account settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
          <LogOut className="size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
