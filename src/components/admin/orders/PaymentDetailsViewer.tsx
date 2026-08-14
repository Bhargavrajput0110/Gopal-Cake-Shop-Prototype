import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Receipt21, CardTick, Code, Danger } from 'iconsax-react';

export function PaymentDetailsViewer({ payments }: { payments: any[] }) {
  if (!payments || payments.length === 0) {
    return (
      <Card className="bg-secondary/20">
        <CardContent className="p-4 text-sm text-muted-foreground flex items-center gap-2">
          <Danger className="w-4 h-4" /> No payment records found for this order.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((payment) => (
        <Card key={payment.id} className="border-border">
          <CardHeader className="p-4 pb-2 border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Receipt21 className="w-4 h-4 text-primary" />
                Ledger Entry
              </CardTitle>
              <Badge variant={
                payment.status === 'SUCCESS' ? 'success' :
                payment.status === 'FAILED' ? 'destructive' : 'secondary'
              }>
                {payment.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-muted-foreground mb-1 font-semibold">Amount</p>
              <p className="font-mono font-bold text-sm">₹{Number(payment.amount).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 font-semibold">Method & Type</p>
              <p>{payment.method} — {payment.type}</p>
            </div>
            
            {payment.referenceId && (
              <div className="col-span-2 pt-2 border-t border-border/50">
                <p className="text-muted-foreground mb-1 flex items-center gap-1 font-semibold">
                  <Code className="w-3 h-3" /> Reference ID
                </p>
                <p className="font-mono text-muted-foreground break-all">{payment.referenceId}</p>
              </div>
            )}
            
            {payment.notes && (
              <div className="col-span-2 pt-2 border-t border-border/50">
                <p className="text-muted-foreground mb-1 flex items-center gap-1 font-semibold">
                  <Code className="w-3 h-3" /> Notes
                </p>
                <p className="font-mono text-muted-foreground break-all">{payment.notes}</p>
              </div>
            )}
            
            <div className="col-span-2 flex justify-between text-muted-foreground pt-2 border-t border-border/50">
              <span>Created: {new Date(payment.createdAt).toLocaleString()}</span>
              {payment.actorId && <span>Actor: {payment.actorId}</span>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
