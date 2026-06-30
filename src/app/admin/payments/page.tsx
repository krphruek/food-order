'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Banknote, Smartphone, Check, Eye } from 'lucide-react'
import { toast } from 'sonner'

type Payment = {
  id: string
  order_id: string
  method: 'cash' | 'promptpay'
  amount: number
  status: 'pending' | 'slip_uploaded' | 'confirmed'
  slip_url: string | null
  confirmed_by: string | null
  confirmed_at: string | null
  created_at: string
  orders: {
    rooms: { room_number: string; name: string | null } | null
    order_items: { name: string; qty: number }[]
  } | null
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'รอชำระ',
  slip_uploaded: 'รอตรวจสลิป',
  confirmed: 'ยืนยันแล้ว',
}
const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  slip_uploaded: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('unconfirmed')
  const [slipView, setSlipView] = useState<Payment | null>(null)

  useEffect(() => {
    fetchPayments()
    const supabase = createClient()
    const channel = supabase
      .channel('admin-payments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, fetchPayments)
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchPayments() {
    const supabase = createClient()
    const { data } = await supabase
      .from('payments')
      .select(`*, orders (rooms (room_number, name), order_items (name, qty))`)
      .order('created_at', { ascending: false })
    setPayments((data as Payment[]) || [])
    setLoading(false)
  }

  async function confirmPayment(id: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('payments')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      toast.error('ยืนยันไม่สำเร็จ: ' + error.message)
      return
    }
    toast.success('ยืนยันการชำระเงินแล้ว')
    setSlipView(null)
  }

  const unconfirmed = payments.filter((p) => p.status !== 'confirmed')
  const confirmed = payments.filter((p) => p.status === 'confirmed')
  const filtered = tab === 'unconfirmed' ? unconfirmed : confirmed

  if (loading) return <p className="text-muted-foreground">กำลังโหลด...</p>

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">ยืนยันการชำระเงิน</h2>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="unconfirmed">รอยืนยัน ({unconfirmed.length})</TabsTrigger>
          <TabsTrigger value="confirmed">ยืนยันแล้ว ({confirmed.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4 space-y-2">
          {filtered.length === 0 && (
            <p className="text-muted-foreground py-12 text-center">ไม่มีรายการ</p>
          )}
          {filtered.map((payment) => (
            <Card key={payment.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="shrink-0">
                  {payment.method === 'cash' ? (
                    <Banknote className="h-8 w-8 text-green-500" />
                  ) : (
                    <Smartphone className="h-8 w-8 text-blue-500" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      ห้อง {payment.orders?.rooms?.room_number}
                      {payment.orders?.rooms?.name ? ` — ${payment.orders.rooms.name}` : ''}
                    </p>
                    <Badge className={STATUS_COLOR[payment.status]}>
                      {STATUS_LABEL[payment.status]}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {payment.method === 'cash' ? '💵 เงินสด' : '📱 PromptPay'} ·{' '}
                    {formatDate(payment.created_at)}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="font-bold">฿{payment.amount}</p>
                </div>

                <div className="flex shrink-0 gap-2">
                  {payment.slip_url && (
                    <Button size="icon" variant="ghost" onClick={() => setSlipView(payment)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  {payment.status !== 'confirmed' && (
                    <Button
                      size="sm"
                      className="bg-green-500 hover:bg-green-600"
                      onClick={() => confirmPayment(payment.id)}
                    >
                      <Check className="mr-1 h-4 w-4" /> ยืนยัน
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* ---- Slip Dialog ---- */}
      <Dialog open={!!slipView} onOpenChange={() => setSlipView(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>สลิปโอนเงิน — ห้อง {slipView?.orders?.rooms?.room_number}</DialogTitle>
          </DialogHeader>

          {slipView && (
            <div className="space-y-4">
              {slipView.slip_url && (
                <img src={slipView.slip_url} alt="สลิป" className="w-full rounded-lg border" />
              )}

              <Separator />

              <div className="space-y-1">
                {slipView.orders?.order_items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>
                      {item.name} × {item.qty}
                    </span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex justify-between font-bold">
                <span>ยอดที่ต้องชำระ</span>
                <span>฿{slipView.amount}</span>
              </div>

              {slipView.status !== 'confirmed' && (
                <Button
                  className="w-full bg-green-500 hover:bg-green-600"
                  onClick={() => confirmPayment(slipView.id)}
                >
                  <Check className="mr-1 h-4 w-4" /> ยืนยันการชำระเงิน
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
