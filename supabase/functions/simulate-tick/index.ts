/**
 * Realistic Simulation Tick Edge Function
 * 
 * Creates lifelike booking patterns:
 * - Popular time slots fill up first
 * - Popular zones are preferred
 * - Bot "teams" book together
 * - Realistic daily patterns
 */

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

// ============================================
// Types
// ============================================

interface BotProfile {
  id: string;
  full_name: string | null;
}

interface Zone {
  id: string;
  zone_type: string;
  capacity: number;
  min_invite_count: number | null;
  seat_labels: string[];
}

interface TimeSlot {
  slot_label: string;
  start_hour: number;
  display_order: number;
}

interface ExistingBooking {
  zone_id: string;
  seat_id: string | null;
  slot_label: string;
  booking_date: string;
  user_id: string;
}

// ============================================
// Realistic Configuration
// ============================================

// Slot popularity weights (higher = more popular)
const SLOT_WEIGHTS: Record<string, number> = {
  '08:00 - 10:00': 0.6,   // Early birds
  '10:00 - 12:00': 1.0,   // Peak morning
  '12:00 - 14:00': 0.95,  // Lunch time - still busy
  '14:00 - 16:00': 0.85,  // Afternoon
  '16:00 - 18:00': 0.7,   // Late afternoon
  '18:00 - 20:00': 0.4,   // Evening - less popular
};

// Zone type popularity (higher = more popular)
const ZONE_TYPE_WEIGHTS: Record<string, number> = {
  'table-6p-share': 1.0,    // Most popular - collaborative
  'desk-3p-round': 0.9,     // Small groups
  'desk-double': 0.75,      // Pairs
  'desk-1p': 0.6,           // Solo work
  'private-zone': 0.5,      // Requires invites - harder to fill
};

// Target fill rates by slot (what % should be booked)
const TARGET_FILL_RATES: Record<string, number> = {
  '10:00 - 12:00': 0.90,  // 90% full
  '12:00 - 14:00': 0.85,  // 85% full  
  '14:00 - 16:00': 0.75,  // 75% full
  '08:00 - 10:00': 0.60,  // 60% full
  '16:00 - 18:00': 0.55,  // 55% full
  '18:00 - 20:00': 0.30,  // 30% full
};

// ============================================
// Helpers
// ============================================

const randomChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const coinFlip = (probability: number): boolean => Math.random() < probability;
const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

const formatDate = (date: Date): string => date.toISOString().split('T')[0];

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Weighted random selection
function weightedChoice<T>(items: T[], weights: number[]): T {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) return items[i];
  }
  
  return items[items.length - 1];
}

// Get all bookable seats for a zone
function getZoneSeats(zone: Zone): Array<{ zone_id: string; seat_id: string | null }> {
  if (zone.zone_type === 'private-zone') {
    return [{ zone_id: zone.id, seat_id: null }];
  }
  
  return zone.seat_labels.map(label => ({
    zone_id: zone.id,
    seat_id: `${zone.id}-${label}`,
  }));
}

// ============================================
// Bot Teams (for group bookings)
// ============================================

function assignBotsToTeams(bots: BotProfile[]): Map<string, BotProfile[]> {
  const teams = new Map<string, BotProfile[]>();
  const shuffledBots = shuffle(bots);
  
  // Create 10-15 teams of varying sizes
  const teamCount = randomInt(10, 15);
  const teamNames = [
    'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon',
    'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa',
    'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron'
  ];
  
  let botIndex = 0;
  for (let i = 0; i < teamCount && botIndex < shuffledBots.length; i++) {
    const teamSize = randomInt(3, 8);
    const teamBots = shuffledBots.slice(botIndex, botIndex + teamSize);
    teams.set(teamNames[i], teamBots);
    botIndex += teamSize;
  }
  
  // Remaining bots are "solo workers"
  const soloWorkers = shuffledBots.slice(botIndex);
  if (soloWorkers.length > 0) {
    teams.set('Solo', soloWorkers);
  }
  
  return teams;
}

// ============================================
// Realistic Booking Logic
// ============================================

async function getSlotOccupancy(
  supabase: SupabaseClient,
  bookingDate: string,
  slotLabel: string,
  zones: Zone[]
): Promise<{ booked: number; total: number; bookedSeats: Set<string> }> {
  const { data: bookings } = await supabase
    .from('bookings')
    .select('zone_id, seat_id')
    .eq('booking_date', bookingDate)
    .eq('slot_label', slotLabel)
    .in('status', ['pending', 'reserved', 'confirmed']);
  
  const bookedSeats = new Set<string>();
  for (const b of bookings ?? []) {
    const key = b.seat_id ? `${b.zone_id}:${b.seat_id}` : `${b.zone_id}:private`;
    bookedSeats.add(key);
  }
  
  // Calculate total available seats
  let total = 0;
  for (const zone of zones) {
    if (zone.zone_type === 'private-zone') {
      total += 1; // Private zone counts as 1 bookable unit
    } else {
      total += zone.seat_labels.length;
    }
  }
  
  return { booked: bookedSeats.size, total, bookedSeats };
}

async function findAvailableSeat(
  supabase: SupabaseClient,
  bookingDate: string,
  slotLabel: string,
  zones: Zone[],
  preferredTypes?: string[]
): Promise<{ zone_id: string; seat_id: string | null } | null> {
  // Get current bookings
  const { bookedSeats } = await getSlotOccupancy(supabase, bookingDate, slotLabel, zones);
  
  // Sort zones by preference
  let sortedZones = [...zones];
  
  if (preferredTypes && preferredTypes.length > 0) {
    sortedZones = sortedZones.filter(z => preferredTypes.includes(z.zone_type));
  }
  
  // Weight zones by popularity
  const weights = sortedZones.map(z => ZONE_TYPE_WEIGHTS[z.zone_type] || 0.5);
  
  // Shuffle with weights
  const weightedZones: Zone[] = [];
  const tempZones = [...sortedZones];
  const tempWeights = [...weights];
  
  while (tempZones.length > 0) {
    const idx = tempWeights.findIndex((_, i) => {
      const totalRemaining = tempWeights.reduce((s, w) => s + w, 0);
      return Math.random() * totalRemaining < tempWeights.slice(0, i + 1).reduce((s, w) => s + w, 0);
    });
    const chosenIdx = idx >= 0 ? idx : 0;
    weightedZones.push(tempZones[chosenIdx]);
    tempZones.splice(chosenIdx, 1);
    tempWeights.splice(chosenIdx, 1);
  }
  
  // Find first available seat
  for (const zone of weightedZones) {
    if (zone.zone_type === 'private-zone') {
      const key = `${zone.id}:private`;
      if (!bookedSeats.has(key)) {
        return { zone_id: zone.id, seat_id: null };
      }
    } else {
      for (const label of zone.seat_labels) {
        const seatId = `${zone.id}-${label}`;
        const key = `${zone.id}:${seatId}`;
        if (!bookedSeats.has(key)) {
          return { zone_id: zone.id, seat_id: seatId };
        }
      }
    }
  }
  
  return null; // Slot is full
}

// ============================================
// Main Simulation Logic
// ============================================

async function runRealisticSimulation(supabase: SupabaseClient): Promise<{
  bookings_created: number;
  friendships_created: number;
  events_voted: number;
  slots_filled: string[];
}> {
  // Load bots
  const { data: bots } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('is_bot', true);
  
  if (!bots || bots.length === 0) {
    throw new Error('No bot profiles found');
  }
  
  // Load zones
  const { data: zones } = await supabase.from('simulation_zones').select('*');
  if (!zones) throw new Error('No zones found');
  
  // Load slots  
  const { data: slots } = await supabase.from('simulation_time_slots').select('*');
  if (!slots) throw new Error('No slots found');
  
  // Assign bots to teams
  const teams = assignBotsToTeams(bots);
  
  // Generate dates (today + next 3 days)
  const dates = [0, 1, 2, 3].map(d => formatDate(addDays(new Date(), d)));
  
  let bookingsCreated = 0;
  let friendshipsCreated = 0;
  let eventsVoted = 0;
  const slotsFilled: string[] = [];
  
  // Sort slots by popularity (fill popular ones first)
  const sortedSlots = [...slots].sort((a, b) => 
    (SLOT_WEIGHTS[b.slot_label] || 0) - (SLOT_WEIGHTS[a.slot_label] || 0)
  );
  
  // For each date and slot, fill to target capacity
  for (const date of dates) {
    for (const slot of sortedSlots) {
      const targetRate = TARGET_FILL_RATES[slot.slot_label] || 0.5;
      const { booked, total, bookedSeats } = await getSlotOccupancy(supabase, date, slot.slot_label, zones);
      const targetBooked = Math.floor(total * targetRate);
      const toBook = targetBooked - booked;
      
      if (toBook <= 0) {
        if (booked >= total * 0.9) {
          slotsFilled.push(`${date} ${slot.slot_label}`);
        }
        continue;
      }
      
      // Book seats until we reach target
      const shuffledBots = shuffle(bots);
      let booked_count = 0;
      
      for (const bot of shuffledBots) {
        if (booked_count >= toBook) break;
        
        // Check if bot already has booking in this slot
        const { data: existing } = await supabase
          .from('bookings')
          .select('id')
          .eq('user_id', bot.id)
          .eq('booking_date', date)
          .eq('slot_label', slot.slot_label)
          .in('status', ['pending', 'reserved', 'confirmed'])
          .limit(1);
        
        if (existing && existing.length > 0) continue;
        
        // Find available seat (prefer collaborative zones)
        const preferredTypes = coinFlip(0.7) 
          ? ['table-6p-share', 'desk-3p-round', 'desk-double']
          : ['desk-1p', 'desk-double'];
        
        const seat = await findAvailableSeat(supabase, date, slot.slot_label, zones, preferredTypes);
        
        if (!seat) break; // No more seats
        
        // Skip private zones for now (need invites)
        if (!seat.seat_id) continue;
        
        // Create booking
        const { error } = await supabase.from('bookings').insert({
          zone_id: seat.zone_id,
          seat_id: seat.seat_id,
          user_id: bot.id,
          booking_date: date,
          slot_label: slot.slot_label,
          status: 'reserved',
        });
        
        if (!error) {
          bookingsCreated++;
          booked_count++;
        }
      }
    }
  }
  
  // Create friendships between team members
  for (const [teamName, teamBots] of teams) {
    if (teamName === 'Solo' || teamBots.length < 2) continue;
    
    // Each team member might become friends
    for (let i = 0; i < teamBots.length - 1; i++) {
      if (!coinFlip(0.3)) continue; // 30% chance
      
      const bot1 = teamBots[i];
      const bot2 = teamBots[i + 1];
      
      // Check if already friends
      const { data: existing } = await supabase
        .from('friendships')
        .select('id')
        .or(`and(requester_id.eq.${bot1.id},receiver_id.eq.${bot2.id}),and(requester_id.eq.${bot2.id},receiver_id.eq.${bot1.id})`)
        .limit(1);
      
      if (existing && existing.length > 0) continue;
      
      const { error } = await supabase.from('friendships').insert({
        requester_id: bot1.id,
        receiver_id: bot2.id,
        status: coinFlip(0.8) ? 'accepted' : 'pending', // 80% instantly accepted
      });
      
      if (!error) friendshipsCreated++;
    }
  }
  
  // Vote for events (make some reach 10 votes)
  const { data: proposalEvents } = await supabase
    .from('events')
    .select('id')
    .eq('status', 'proposal');
  
  for (const event of proposalEvents ?? []) {
    // Get current vote count
    const { count } = await supabase
      .from('event_votes')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event.id);
    
    const currentVotes = count ?? 0;
    const votesNeeded = 10 - currentVotes;
    
    if (votesNeeded <= 0) continue;
    
    // Add votes (higher chance to reach threshold)
    const votesToAdd = coinFlip(0.6) ? votesNeeded : randomInt(1, votesNeeded);
    const voters = shuffle(bots).slice(0, votesToAdd);
    
    for (const voter of voters) {
      const { error } = await supabase.from('event_votes').insert({
        event_id: event.id,
        user_id: voter.id,
      });
      
      if (!error) eventsVoted++;
    }
  }
  
  // Log this tick
  await supabase.from('simulation_action_log').insert({
    action_type: 'booking_create',
    bot_id: bots[0].id,
    success: true,
    context: {
      type: 'realistic_tick',
      bookings_created: bookingsCreated,
      friendships_created: friendshipsCreated,
      events_voted: eventsVoted,
      slots_filled: slotsFilled.length,
    },
  });
  
  return {
    bookings_created: bookingsCreated,
    friendships_created: friendshipsCreated,
    events_voted: eventsVoted,
    slots_filled: slotsFilled,
  };
}

// ============================================
// HTTP Handler
// ============================================

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const mode = url.searchParams.get('mode') ?? 'realistic';
    
    if (mode === 'realistic' || mode === 'fill') {
      const result = await runRealisticSimulation(supabase);
      
      return new Response(JSON.stringify({
        ok: true,
        mode: 'realistic',
        ...result,
        timestamp: new Date().toISOString(),
      }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // Fallback to simple status
    return new Response(JSON.stringify({
      ok: true,
      message: 'Use ?mode=realistic to run simulation',
    }), {
      headers: { "Content-Type": "application/json" },
    });
    
  } catch (error) {
    console.error('Simulation tick error:', error);
    return new Response(JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
