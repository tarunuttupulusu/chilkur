import React from 'react';
import prisma from '@/lib/prisma';
import { 
  Users, Calendar as CalendarIcon, CheckCircle, Clock, ArrowRight, 
  TrendingUp, UtensilsCrossed, MessageSquare, Mail, ShieldAlert 
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalReservations,
    todayReservations,
    verifiedDiscounts,
    dishCount,
    photoCount,
    pendingTestimonials,
    messageCount,
    recentReservations
  ] = await Promise.all([
    prisma.reservation.count(),
    prisma.reservation.count({
      where: {
        date: {
          gte: today,
        }
      }
    }),
    prisma.reservation.count({
      where: {
        discountVerified: true
      }
    }),
    prisma.dish.count(),
    prisma.galleryPhoto.count(),
    prisma.testimonial.count({
      where: { isApproved: false }
    }),
    prisma.contactMessage.count(),
    prisma.reservation.findMany({
      orderBy: [
        { date: 'desc' },
        { time: 'desc' }
      ],
      take: 5
    })
  ]);

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* Welcome header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-accent bg-brand-accent/15 px-3 py-1 rounded-full border border-brand-accent/20">
            System Status: Active
          </span>
          <h1 className="text-3xl font-display font-black text-brand-dark mt-3">Welcome Back, Admin</h1>
          <p className="text-brand-dark/60 font-sans text-sm mt-1">Here is a quick overview of your restaurant's performance today.</p>
        </div>
        
        {/* Quick action scanning button */}
        <div className="flex items-center gap-3">
          <Link 
            href="/admin/scanner" 
            className="inline-flex items-center justify-center gap-2 bg-brand-accent hover:bg-brand-accent/90 text-white font-bold uppercase tracking-wider text-xs px-6 py-3.5 rounded-2xl shadow-lg shadow-brand-accent/25 transition-all"
          >
            <span>Open QR Scanner</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Stats row grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Stat card 1 */}
        <div className="bg-white rounded-3xl p-6 border border-brand-gold/10 shadow-md flex items-center gap-5 hover:shadow-lg transition-all duration-300">
          <div className="bg-brand-accent/10 text-brand-accent p-4 rounded-2xl border border-brand-accent/15">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-dark/50">Today's Bookings</p>
            <p className="text-3xl font-black text-brand-dark mt-1 font-mono">{todayReservations}</p>
          </div>
        </div>

        {/* Stat card 2 */}
        <div className="bg-white rounded-3xl p-6 border border-brand-gold/10 shadow-md flex items-center gap-5 hover:shadow-lg transition-all duration-300">
          <div className="bg-brand-gold/15 text-brand-gold p-4 rounded-2xl border border-brand-gold/10">
            <Users size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-dark/50">Total Bookings</p>
            <p className="text-3xl font-black text-brand-dark mt-1 font-mono">{totalReservations}</p>
          </div>
        </div>

        {/* Stat card 3 */}
        <div className="bg-white rounded-3xl p-6 border border-brand-gold/10 shadow-md flex items-center gap-5 hover:shadow-lg transition-all duration-300">
          <div className="bg-green-50 text-green-600 p-4 rounded-2xl border border-green-100">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-dark/50">Discounts Claimed</p>
            <p className="text-3xl font-black text-brand-dark mt-1 font-mono">{verifiedDiscounts}</p>
          </div>
        </div>
      </div>

      {/* CMS Statistics Dashboard Row */}
      <div className="space-y-4">
        <h2 className="font-display font-black text-lg text-brand-dark px-1">CMS Control Statistics</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/admin/menu" className="bg-white p-5 rounded-2xl border border-brand-gold/10 hover:border-brand-accent shadow-sm flex items-center gap-4 transition-all">
            <div className="p-3 rounded-xl bg-brand-accent/10 text-brand-accent">
              <UtensilsCrossed size={20} />
            </div>
            <div>
              <span className="block text-[9px] font-bold uppercase text-brand-dark/40">Total Dishes</span>
              <span className="font-display font-black text-brand-dark text-lg">{dishCount} Items</span>
            </div>
          </Link>

          <Link href="/admin/gallery" className="bg-white p-5 rounded-2xl border border-brand-gold/10 hover:border-brand-accent shadow-sm flex items-center gap-4 transition-all">
            <div className="p-3 rounded-xl bg-brand-accent/10 text-brand-accent">
              <CalendarIcon size={20} />
            </div>
            <div>
              <span className="block text-[9px] font-bold uppercase text-brand-dark/40">Gallery Photos</span>
              <span className="font-display font-black text-brand-dark text-lg">{photoCount} Assets</span>
            </div>
          </Link>

          <Link href="/admin/testimonials" className="bg-white p-5 rounded-2xl border border-brand-gold/10 hover:border-brand-accent shadow-sm flex items-center gap-4 transition-all">
            <div className="p-3 rounded-xl bg-yellow-50 text-yellow-600">
              <MessageSquare size={20} />
            </div>
            <div>
              <span className="block text-[9px] font-bold uppercase text-brand-dark/40">Pending Reviews</span>
              <span className="font-display font-black text-brand-dark text-lg">{pendingTestimonials} Reviews</span>
            </div>
          </Link>

          <Link href="/admin/messages" className="bg-white p-5 rounded-2xl border border-brand-gold/10 hover:border-brand-accent shadow-sm flex items-center gap-4 transition-all">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <Mail size={20} />
            </div>
            <div>
              <span className="block text-[9px] font-bold uppercase text-brand-dark/40">Inbound Messages</span>
              <span className="font-display font-black text-brand-dark text-lg">{messageCount} Inbox</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Main dashboard data rows */}
      <div className="grid grid-cols-1 gap-8">
        {/* Recent reservations panel */}
        <div className="bg-white rounded-3xl border border-brand-gold/10 shadow-md overflow-hidden">
          <div className="p-6 md:p-8 border-b border-brand-dark/5 flex justify-between items-center bg-[#F6EFE3]/20">
            <div>
              <h2 className="font-display font-black text-lg text-brand-dark">Latest Reservations</h2>
              <p className="text-xs text-brand-dark/50">Realtime feed of recently booked tables</p>
            </div>
            <Link 
              href="/admin/reservations" 
              className="text-xs font-bold uppercase tracking-widest text-brand-accent hover:text-brand-dark transition-colors"
            >
              View All
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-dark/5 text-[10px] font-black uppercase tracking-widest text-brand-dark/50 bg-[#F6EFE3]/10">
                  <th className="p-5">Ref ID</th>
                  <th className="p-5">Customer</th>
                  <th className="p-5">Schedule</th>
                  <th className="p-5">Size</th>
                  <th className="p-5">Claim Code Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-dark/5 font-sans">
                {recentReservations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-brand-dark/40 font-medium">No reservations recorded yet.</td>
                  </tr>
                ) : (
                  recentReservations.map((res) => (
                    <tr key={res.id} className="hover:bg-[#F6EFE3]/15 transition-colors">
                      <td className="p-5 font-mono text-sm font-bold text-brand-dark">{res.bookingRef}</td>
                      <td className="p-5">
                        <div className="font-bold text-brand-dark">{res.customerName}</div>
                        <div className="text-xs text-brand-dark/55">{res.phone}</div>
                      </td>
                      <td className="p-5 text-sm text-brand-dark">
                        <div className="font-semibold">{res.date.toLocaleDateString()}</div>
                        <div className="text-xs text-brand-dark/50">{res.time}</div>
                      </td>
                      <td className="p-5 text-sm font-bold text-brand-dark">{res.guests} persons</td>
                      <td className="p-5">
                        {res.discountVerified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 text-[10px] font-black uppercase rounded-lg border border-green-100">
                            <CheckCircle size={10} /> Claimed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-black uppercase rounded-lg border border-amber-100">
                            <Clock size={10} /> Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
