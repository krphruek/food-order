'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { UtensilsCrossed, BedDouble, ClipboardList, CreditCard, Settings } from 'lucide-react'

const navItems = [
  { href: '/admin/menu', label: 'เมนู', icon: UtensilsCrossed },
  { href: '/admin/rooms', label: 'ห้อง', icon: BedDouble },
  { href: '/admin/orders', label: 'ออเดอร์', icon: ClipboardList },
  { href: '/admin/payments', label: 'ชำระเงิน', icon: CreditCard },
  { href: '/admin/settings', label: 'ตั้งค่า', icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top Bar */}
      <header className="bg-background sticky top-0 z-10 border-b">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3">
          <UtensilsCrossed className="h-5 w-5 text-orange-500" />
          <h1 className="text-lg font-bold">Admin Panel</h1>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1">
        {/* Sidebar */}
        <aside className="hidden w-48 shrink-0 border-r py-4 md:block">
          <nav className="space-y-1 px-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    pathname === item.href
                      ? 'bg-orange-50 font-medium text-orange-600'
                      : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-4 py-6 pb-24 md:pb-6 overflow-auto">{children}</main>
      </div>

      {/* Bottom Nav (mobile) */}
      <nav className="bg-background fixed right-0 bottom-0 left-0 flex border-t md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors',
                pathname === item.href ? 'text-orange-500' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
