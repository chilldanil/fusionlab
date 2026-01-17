/**
 * Simulation Control Edge Function
 * 
 * Provides API for managing simulation settings and viewing stats.
 * 
 * Endpoints:
 * - GET /simulation-control?action=status - Get current status
 * - GET /simulation-control?action=start - Enable simulation
 * - GET /simulation-control?action=stop - Disable simulation
 * - GET /simulation-control?action=stats - Get detailed statistics
 * - GET /simulation-control?action=config&key=X&value=Y - Update config
 */

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

async function getStatus() {
  const { data: config } = await supabase
    .from('simulation_config')
    .select('*')
    .eq('name', 'default')
    .single();
  
  const { data: state } = await supabase
    .from('simulation_state')
    .select('*')
    .eq('config_id', config?.id)
    .maybeSingle();
  
  const { count: botCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_bot', true);
  
  return {
    is_active: config?.is_active ?? false,
    bot_count: botCount ?? 0,
    target_bot_count: config?.bot_count ?? 80,
    tick_interval_seconds: config?.tick_interval_seconds ?? 300,
    actions_per_tick: config?.actions_per_tick ?? 30,
    last_tick_at: state?.last_tick_at ?? null,
    next_tick_at: state?.next_tick_at ?? null,
    total_ticks: state?.total_ticks ?? 0,
    config,
    state,
  };
}

async function startSimulation() {
  const { error } = await supabase
    .from('simulation_config')
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq('name', 'default');
  
  if (error) throw error;
  
  return { started: true, message: 'Simulation enabled' };
}

async function stopSimulation() {
  const { error } = await supabase
    .from('simulation_config')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('name', 'default');
  
  if (error) throw error;
  
  return { stopped: true, message: 'Simulation disabled' };
}

async function getStats() {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  // Get action counts for today
  const { data: todayActions } = await supabase
    .from('simulation_action_log')
    .select('action_type, success')
    .gte('created_at', `${today}T00:00:00Z`);
  
  // Get action counts for last 24h
  const { data: last24hActions } = await supabase
    .from('simulation_action_log')
    .select('action_type, success')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  
  // Group by action type
  const groupByActionType = (actions: any[]) => {
    const groups: Record<string, { total: number; succeeded: number; failed: number }> = {};
    for (const action of actions ?? []) {
      if (!groups[action.action_type]) {
        groups[action.action_type] = { total: 0, succeeded: 0, failed: 0 };
      }
      groups[action.action_type].total++;
      if (action.success) {
        groups[action.action_type].succeeded++;
      } else {
        groups[action.action_type].failed++;
      }
    }
    return groups;
  };
  
  // Get booking stats
  const { count: totalBookings } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true });
  
  const { count: activeBookings } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .in('status', ['pending', 'reserved', 'confirmed']);
  
  // Get friendship stats
  const { count: totalFriendships } = await supabase
    .from('friendships')
    .select('*', { count: 'exact', head: true });
  
  const { count: acceptedFriendships } = await supabase
    .from('friendships')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'accepted');
  
  // Get event stats
  const { count: totalEvents } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true });
  
  const { count: proposalEvents } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'proposal');
  
  const { count: confirmedEvents } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'confirmed');
  
  return {
    today: {
      date: today,
      actions: groupByActionType(todayActions ?? []),
      total_actions: todayActions?.length ?? 0,
    },
    last_24h: {
      actions: groupByActionType(last24hActions ?? []),
      total_actions: last24hActions?.length ?? 0,
    },
    database_totals: {
      bookings: { total: totalBookings ?? 0, active: activeBookings ?? 0 },
      friendships: { total: totalFriendships ?? 0, accepted: acceptedFriendships ?? 0 },
      events: { total: totalEvents ?? 0, proposals: proposalEvents ?? 0, confirmed: confirmedEvents ?? 0 },
    },
  };
}

async function updateConfig(key: string, value: string) {
  // Validate key
  const allowedKeys = [
    'is_active', 'bot_count', 'tick_interval_seconds', 'actions_per_tick',
    'booking_create_rate', 'booking_confirm_rate', 'booking_cancel_rate',
    'conflict_rate', 'invite_rate', 'invite_accept_rate', 'invite_reject_rate',
    'friendship_request_rate', 'friendship_accept_rate',
    'event_create_rate', 'event_vote_rate', 'event_join_rate',
    'morning_wave_multiplier', 'lunch_wave_multiplier', 'evening_wave_multiplier',
    'booking_date_min_days', 'booking_date_max_days',
  ];
  
  if (!allowedKeys.includes(key)) {
    throw new Error(`Invalid config key: ${key}. Allowed: ${allowedKeys.join(', ')}`);
  }
  
  // Parse value based on key type
  let parsedValue: unknown;
  if (key === 'is_active') {
    parsedValue = value === 'true';
  } else if (key.includes('rate') || key.includes('multiplier')) {
    parsedValue = parseFloat(value);
  } else {
    parsedValue = parseInt(value, 10);
  }
  
  const { error } = await supabase
    .from('simulation_config')
    .update({ [key]: parsedValue, updated_at: new Date().toISOString() })
    .eq('name', 'default');
  
  if (error) throw error;
  
  return { updated: true, key, value: parsedValue };
}

async function getRecentLogs(limit: number = 50) {
  const { data } = await supabase
    .from('simulation_action_log')
    .select(`
      id,
      action_type,
      bot_id,
      success,
      error_message,
      context,
      created_at,
      bot:bot_id(full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  return (data ?? []).map((log: any) => ({
    ...log,
    bot_name: Array.isArray(log.bot) ? log.bot[0]?.full_name : log.bot?.full_name,
  }));
}

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') ?? 'status';
    
    let result: unknown;
    
    switch (action) {
      case 'status':
        result = await getStatus();
        break;
      case 'start':
        result = await startSimulation();
        break;
      case 'stop':
        result = await stopSimulation();
        break;
      case 'stats':
        result = await getStats();
        break;
      case 'config':
        const key = url.searchParams.get('key');
        const value = url.searchParams.get('value');
        if (!key || !value) {
          throw new Error('Missing key or value parameter');
        }
        result = await updateConfig(key, value);
        break;
      case 'logs':
        const limit = parseInt(url.searchParams.get('limit') ?? '50', 10);
        result = await getRecentLogs(limit);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    return new Response(JSON.stringify({
      ok: true,
      action,
      data: result,
      timestamp: new Date().toISOString(),
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error('Simulation control error:', error);
    return new Response(JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
