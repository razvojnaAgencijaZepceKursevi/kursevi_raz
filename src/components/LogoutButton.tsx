'use client';

import Button from '@mui/material/Button';
import { useLogout } from '@/hooks/useLogout';

export default function LogoutButton() {
  const { logout, pending } = useLogout();

  return (
    <Button variant="outlined" size="small" onClick={() => void logout()} disabled={pending}>
      {pending ? 'Signing out…' : 'Sign out'}
    </Button>
  );
}
