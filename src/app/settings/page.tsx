"use client";

import { useState, useEffect } from 'react';
import { AuthProvider } from '@/hooks/use-auth';
import { AppLayout } from '@/components/layout/AppLayout';
import { db, User } from '@/lib/db';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Settings, Building2, User as UserIcon, Lock, Palette } from 'lucide-react';

function SettingsContent() {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [clinicName, setClinicName] = useState('KuskoDento');
  const [clinicSubtitle, setClinicSubtitle] = useState('Clínica Odontológica');
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('kd_clinic_config');
    if (saved) {
      const config = JSON.parse(saved);
      setClinicName(config.clinicName || 'KuskoDento');
      setClinicSubtitle(config.clinicSubtitle || 'Clínica Odontológica');
      setClinicAddress(config.clinicAddress || '');
      setClinicPhone(config.clinicPhone || '');
    }
  }, []);

  const handleSaveClinic = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('kd_clinic_config', JSON.stringify({
      clinicName, clinicSubtitle, clinicAddress, clinicPhone
    }));
    toast({ title: 'Configuración guardada', description: 'Los datos de la clínica han sido actualizados.' });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Error', description: 'Las contraseñas no coinciden.' });
      return;
    }
    if (newPassword.length < 4) {
      toast({ variant: 'destructive', title: 'Error', description: 'La contraseña debe tener al menos 4 caracteres.' });
      return;
    }
    if (!user) return;

    const updatedUser: User = { ...user, password: newPassword };
    await db.put('users', updatedUser);
    localStorage.setItem('kd_session', JSON.stringify(updatedUser));

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    toast({ title: 'Contraseña actualizada', description: 'Tu contraseña ha sido cambiada correctamente.' });
  };

  return (
    <AppLayout>
      <div className="space-y-8 max-w-2xl">
        <div>
          <h2 className="text-3xl font-bold text-primary flex items-center gap-3">
            <Settings className="w-8 h-8" />
            Configuración
          </h2>
          <p className="text-muted-foreground mt-1">Personaliza el sistema y tu cuenta</p>
        </div>

        {/* Datos de la clínica */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Datos de la Clínica
            </CardTitle>
            <CardDescription>Información que aparece en el encabezado y documentos</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveClinic} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clinicName">Nombre de la Clínica</Label>
                  <Input
                    id="clinicName"
                    value={clinicName}
                    onChange={e => setClinicName(e.target.value)}
                    placeholder="KuskoDento"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinicSubtitle">Subtítulo</Label>
                  <Input
                    id="clinicSubtitle"
                    value={clinicSubtitle}
                    onChange={e => setClinicSubtitle(e.target.value)}
                    placeholder="Clínica Odontológica"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinicPhone">Teléfono</Label>
                  <Input
                    id="clinicPhone"
                    value={clinicPhone}
                    onChange={e => setClinicPhone(e.target.value)}
                    placeholder="084-123456"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinicAddress">Dirección</Label>
                  <Input
                    id="clinicAddress"
                    value={clinicAddress}
                    onChange={e => setClinicAddress(e.target.value)}
                    placeholder="Av. Principal 123, Cusco"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">Guardar datos de la clínica</Button>
            </form>
          </CardContent>
        </Card>

        <Separator />

        {/* Cambiar contraseña */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Cambiar Contraseña
            </CardTitle>
            <CardDescription>Actualiza la contraseña de tu cuenta: <strong>{user?.username}</strong></CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva contraseña</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <Button type="submit" variant="outline" className="w-full">Cambiar contraseña</Button>
            </form>
          </CardContent>
        </Card>

        <Separator />

        {/* Info del sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Información del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Versión</span>
              <span className="font-medium text-foreground">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>Base de datos</span>
              <span className="font-medium text-foreground">IndexedDB (local)</span>
            </div>
            <div className="flex justify-between">
              <span>Usuario activo</span>
              <span className="font-medium text-foreground">{user?.fullName || user?.username}</span>
            </div>
            <div className="flex justify-between">
              <span>Rol</span>
              <span className="font-medium text-foreground capitalize">{user?.role}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

export default function SettingsPage() {
  return (
    <AuthProvider>
      <SettingsContent />
    </AuthProvider>
  );
}
