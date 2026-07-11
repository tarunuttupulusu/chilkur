import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

const QR_SECRET_KEY = process.env.QR_SECRET_KEY || 'fallback-dev-secret-key-12345';

export async function POST(request: Request) {
  try {
    // 1. Verify Admin Authentication (Supabase)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Uncomment in production once auth is fully integrated
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { qrToken, bookingRef } = await request.json();
    let bookingRefToFind = '';

    if (bookingRef) {
      bookingRefToFind = bookingRef;
    } else {
      if (!qrToken) {
        return NextResponse.json({ error: 'QR Token or Booking Reference is required' }, { status: 400 });
      }

      // 2. Validate HMAC Signature
      const [payloadBase64, signature] = qrToken.split('.');
      if (!payloadBase64 || !signature) {
        return NextResponse.json({ error: 'Invalid QR token format' }, { status: 400 });
      }

      const payloadString = Buffer.from(payloadBase64, 'base64').toString('utf-8');
      const expectedSignature = crypto.createHmac('sha256', QR_SECRET_KEY).update(payloadString).digest('hex');

      if (signature !== expectedSignature) {
        return NextResponse.json({ error: 'Invalid or tampered QR code' }, { status: 403 });
      }

      const payload = JSON.parse(payloadString);
      bookingRefToFind = payload.bookingRef;
    }

    // 3. Find Reservation
    const reservation = await prisma.reservation.findUnique({
      where: { bookingRef: bookingRefToFind }
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    if (reservation.discountVerified) {
      return NextResponse.json({ error: 'Discount already claimed for this reservation' }, { status: 400 });
    }

    // 4. Update Reservation (Mark as verified/arrived)
    const updatedReservation = await prisma.reservation.update({
      where: { bookingRef: bookingRefToFind },
      data: {
        discountVerified: true,
        qrScannedAt: new Date(),
        status: 'arrived'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'QR Code verified! 10% Discount applied.',
      reservation: updatedReservation
    });

  } catch (error) {
    console.error('QR Scan Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
