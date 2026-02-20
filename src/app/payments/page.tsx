"use client";

import { useState, useEffect } from 'react';
import { AuthProvider } from '@/hooks/use-auth';
import { AppLayout } from '@/components/layout/AppLayout';
import { db, Payment, Patient, Appointment } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Search, Filter, ChevronLeft, ChevronRight, HandCoins } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const PAGE_SIZE = 10;

function PaymentsContent() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingPayment, setEditingPayment] = useState<any | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [newAmo, setNewAmo] = useState(0);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const allP = await db.getAll<Payment>('payments');
    const allPatients = await db.getAll<Patient>('patients');
    
    const fullPayments = allP.map(p => {
      const patient = allPatients.find(pat => pat.id === p.patientId);
      return {
        ...p,
        patientName: patient ? `${patient.lastNames}, ${patient.names}` : 'Desconocido',
        patientDni: patient?.dni || '',
      };
    });

    setPayments(fullPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPayment) {
      const newPaid = editingPayment.totalPaid + newAmo;
      const newBalance = Math.max(0, editingPayment.totalCost - newPaid);
      const date = new Date().toLocaleDateString('es-PE');
      const time = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

      const updatedHistory = [...(editingPayment.history || [])];
      updatedHistory.push({ date, time, amount: newAmo });

      const updatedPayment: Payment = {
        ...editingPayment,
        totalPaid: newPaid,
        balance: newBalance,
        date: date,
        time: time,
        history: updatedHistory
      };

      await db.put('payments', updatedPayment);

      if (editingPayment.appointmentId) {
        const appointment = await db.getById<Appointment>('appointments', editingPayment.appointmentId);
        if (appointment) {
          await db.put('appointments', { 
            ...appointment, 
            paidAmount: newPaid, 
            balance: newBalance 
          });
        }
      }

      setIsEditOpen(false);
      setNewAmo(0);
      toast({ title: "Abono registrado", description: `Nuevo saldo: S/. ${newBalance.toFixed(2)}` });
      load();
    }
  };

  const filtered = payments.filter(p => 
    p.patientName.toLowerCase().includes(search.toLowerCase()) || 
    p.treatmentName.toLowerCase().includes(search.toLowerCase()) ||
    p.patientDni.includes(search)
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginatedData = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const totalRecaudado = payments.reduce((acc, curr) => acc + curr.totalPaid, 0);
  const totalSaldos = payments.reduce((acc, curr) => acc + curr.balance, 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-primary">Seguimiento Financiero</h2>
            <p className="text-muted-foreground mt-1">Historial de abonos y deudas por paciente</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-sm bg-primary/5">
             <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Recaudado</CardTitle></CardHeader>
             <CardContent><div className="text-3xl font-bold text-primary">S/. {totalRecaudado.toFixed(2)}</div></CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-amber-50">
             <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Saldos Pendientes</CardTitle></CardHeader>
             <CardContent><div className="text-3xl font-bold text-amber-600">S/. {totalSaldos.toFixed(2)}</div></CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-emerald-50">
             <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Transacciones</CardTitle></CardHeader>
             <CardContent><div className="text-3xl font-bold text-emerald-600">{payments.length}</div></CardContent>
          </Card>
        </div>

        <Card className="p-6">
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Buscar por DNI, paciente o tratamiento..." 
                className="pl-10 h-11"
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Tratamiento</TableHead>
                  <TableHead>Costo</TableHead>
                  <TableHead>Pagado</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-bold">{p.patientName}</div>
                      <div className="text-[10px] text-muted-foreground">DNI: {p.patientDni}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-xs uppercase">{p.treatmentName}</div>
                      <div className="text-[10px] text-muted-foreground">{p.date}</div>
                    </TableCell>
                    <TableCell className="font-medium">S/. {p.totalCost.toFixed(2)}</TableCell>
                    <TableCell className="font-bold text-emerald-600">S/. {p.totalPaid.toFixed(2)}</TableCell>
                    <TableCell className="font-bold">S/. {p.balance.toFixed(2)}</TableCell>
                    <TableCell>
                       <Badge variant={p.balance > 0 ? 'outline' : 'default'} className={p.balance > 0 ? 'text-amber-600 border-amber-600' : 'bg-emerald-500'}>
                         {p.balance > 0 ? 'PENDIENTE' : 'CANCELADO'}
                       </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="sm" className="gap-2" onClick={() => { setEditingPayment(p); setIsEditOpen(true); }} disabled={p.balance === 0}>
                         <HandCoins className="w-4 h-4" /> Amortizar
                       </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
               <span className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</span>
               <div className="flex gap-2">
                 <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                   <ChevronLeft className="w-4 h-4" />
                 </Button>
                 <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
                   <ChevronRight className="w-4 h-4" />
                 </Button>
               </div>
            </div>
          )}
        </Card>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
           <DialogContent>
             <DialogHeader><DialogTitle>Registrar Amortización</DialogTitle></DialogHeader>
             {editingPayment && (
               <form onSubmit={handleUpdate} className="space-y-4 py-4">
                 <div className="p-4 bg-muted rounded-md space-y-2">
                   <p className="text-sm">Paciente: <b>{editingPayment.patientName}</b></p>
                   <p className="text-sm">Tratamiento: <b>{editingPayment.treatmentName}</b></p>
                   <p className="text-sm">Saldo Actual: <b className="text-amber-600">S/. {editingPayment.balance.toFixed(2)}</b></p>
                 </div>
                 <div className="space-y-2">
                   <Label>Monto a abonar (S/.)</Label>
                   <Input 
                     type="number" 
                     step="0.01" 
                     max={editingPayment.balance}
                     value={newAmo} 
                     onChange={e => setNewAmo(parseFloat(e.target.value) || 0)} 
                   />
                 </div>
                 <DialogFooter>
                   <Button type="submit" className="w-full h-12" disabled={newAmo <= 0 || newAmo > editingPayment.balance}>Confirmar Abono</Button>
                 </DialogFooter>
               </form>
             )}
           </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

export default function PaymentsPage() {
  return (
    <AuthProvider>
      <PaymentsContent />
    </AuthProvider>
  );
}
