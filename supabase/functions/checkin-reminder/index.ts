import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const parseSlotStart = (bookingDate: string, slotLabel: string) => {
  const [startLabel] = slotLabel.split(" - ");
  return new Date(`${bookingDate}T${startLabel}:00`);
};

serve(async () => {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("id, user_id, booking_date, slot_label, arrival_confirmed_at, status")
    .in("status", ["reserved", "pending"])
    .in("booking_date", [today, tomorrow]);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const notifications: Array<{
    booking_id: string;
    user_id: string;
    type: "checkin_required" | "no_show_cancelled";
    message: string;
  }> = [];

  for (const booking of bookings ?? []) {
    if (booking.arrival_confirmed_at) continue;
    const start = parseSlotStart(booking.booking_date, booking.slot_label);
    const checkinWindowStart = new Date(start.getTime() - 15 * 60 * 1000);
    const noShowTime = new Date(start.getTime() + 15 * 60 * 1000);

    if (now >= checkinWindowStart && now < start) {
      notifications.push({
        booking_id: booking.id,
        user_id: booking.user_id,
        type: "checkin_required",
        message: `Check-in required for ${booking.booking_date} ${booking.slot_label}.`,
      });
    }

    if (now >= noShowTime) {
      await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", booking.id);

      notifications.push({
        booking_id: booking.id,
        user_id: booking.user_id,
        type: "no_show_cancelled",
        message: `Booking cancelled due to no-show (${booking.booking_date} ${booking.slot_label}).`,
      });
    }
  }

  if (notifications.length > 0) {
    await supabase
      .from("booking_notifications")
      .upsert(notifications, { onConflict: "booking_id,type", ignoreDuplicates: true });
  }

  return new Response(JSON.stringify({ ok: true, notified: notifications.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
