/**
 * Bot Seeding Edge Function
 * 
 * Creates bot student accounts in auth.users and profiles.
 * Run once to populate the system with simulated users.
 * 
 * Usage:
 * - GET /seed-bots?count=80 - Create 80 bot accounts
 * - GET /seed-bots?count=10&prefix=test - Create 10 bots with custom prefix
 */

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

// Use Admin API for creating users
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ============================================
// Bot Name Generation
// ============================================

const FIRST_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery',
  'Skylar', 'Dakota', 'Phoenix', 'River', 'Sage', 'Rowan', 'Finley', 'Emery',
  'Blake', 'Drew', 'Jamie', 'Jesse', 'Kelly', 'Lee', 'Pat', 'Sam',
  'Cameron', 'Charlie', 'Dylan', 'Ellis', 'Frankie', 'Hayden', 'Kendall', 'Logan',
  'Micah', 'Nico', 'Oakley', 'Parker', 'Reese', 'Spencer', 'Terry', 'Val',
  'Aria', 'Bella', 'Chloe', 'Diana', 'Emma', 'Fiona', 'Grace', 'Hannah',
  'Ivy', 'Julia', 'Kate', 'Luna', 'Maya', 'Nina', 'Olivia', 'Piper',
  'Raven', 'Sofia', 'Tara', 'Uma', 'Vera', 'Willow', 'Xena', 'Yara', 'Zoe',
  'Aiden', 'Ben', 'Cole', 'David', 'Ethan', 'Felix', 'Gabe', 'Henry',
  'Isaac', 'Jack', 'Kyle', 'Liam', 'Max', 'Noah', 'Owen', 'Paul',
];

const LAST_NAMES = [
  'Anderson', 'Brown', 'Campbell', 'Davis', 'Edwards', 'Foster', 'Garcia', 'Harris',
  'Jackson', 'Kim', 'Lee', 'Martinez', 'Nguyen', 'O\'Brien', 'Patel', 'Quinn',
  'Rodriguez', 'Smith', 'Taylor', 'Upton', 'Vargas', 'Wilson', 'Xavier', 'Young', 'Zhang',
  'Adams', 'Baker', 'Clark', 'Dixon', 'Evans', 'Fisher', 'Green', 'Hall',
  'Ivanov', 'Jones', 'King', 'Lopez', 'Moore', 'Nelson', 'Ortiz', 'Peterson',
  'Reed', 'Scott', 'Thomas', 'Underwood', 'Vincent', 'White', 'York', 'Zimmerman',
];

const SKILLS = [
  'JavaScript', 'TypeScript', 'Python', 'React', 'Node.js', 'SQL', 'AWS',
  'Docker', 'Kubernetes', 'GraphQL', 'REST APIs', 'Git', 'CI/CD', 'Linux',
  'Machine Learning', 'Data Science', 'UI/UX Design', 'Figma', 'Photoshop',
  'Agile', 'Scrum', 'Project Management', 'Communication', 'Leadership',
  'Problem Solving', 'Critical Thinking', 'Teamwork', 'Time Management',
];

const BIOS = [
  'Passionate about technology and learning new things.',
  'Computer Science student with a love for coding.',
  'Always exploring new technologies and frameworks.',
  'Building cool projects one line at a time.',
  'Interested in AI, web development, and open source.',
  'Coffee enthusiast and late-night coder.',
  'Turning ideas into reality through code.',
  'Lifelong learner on a journey to mastery.',
  'Full-stack developer in training.',
  'Creative problem solver with a technical mindset.',
  'Data nerd with a passion for visualization.',
  'UX advocate who believes design is key.',
  'Backend specialist who loves clean architecture.',
  'Mobile-first thinker building for the future.',
  'DevOps enthusiast automating everything.',
];

const randomChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const randomSubset = <T>(arr: T[], count: number): T[] => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

interface BotCreationResult {
  email: string;
  success: boolean;
  error?: string;
  user_id?: string;
}

async function createBot(
  index: number,
  prefix: string
): Promise<BotCreationResult> {
  const firstName = randomChoice(FIRST_NAMES);
  const lastName = randomChoice(LAST_NAMES);
  const fullName = `${firstName} ${lastName}`;
  const email = `${prefix}+bot${index.toString().padStart(3, '0')}@simulation.local`;
  const password = `SimBot${index}!Pass${Date.now().toString(36)}`;
  
  try {
    // Create auth user using admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
        is_bot: true,
      },
    });
    
    if (authError) {
      return { email, success: false, error: authError.message };
    }
    
    if (!authData.user) {
      return { email, success: false, error: 'No user returned' };
    }
    
    const userId = authData.user.id;
    
    // Update profile with additional data (profile should be auto-created by trigger)
    // Wait a moment for the trigger to execute
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const skills = randomSubset(SKILLS, randomInt(3, 6));
    const bio = randomChoice(BIOS);
    const xp = randomInt(0, 500);
    
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        bio,
        skills,
        xp,
        is_bot: true,
        is_incognito: false,
      })
      .eq('id', userId);
    
    if (profileError) {
      console.warn(`Profile update failed for ${email}: ${profileError.message}`);
    }
    
    return { email, success: true, user_id: userId };
  } catch (error) {
    return { email, success: false, error: String(error) };
  }
}

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const countParam = url.searchParams.get('count');
    const prefix = url.searchParams.get('prefix') ?? 'sim';
    const dryRun = url.searchParams.get('dry_run') === 'true';
    
    const count = Math.min(parseInt(countParam ?? '80', 10), 200); // Max 200 at once
    
    if (dryRun) {
      return new Response(JSON.stringify({
        ok: true,
        dry_run: true,
        would_create: count,
        email_pattern: `${prefix}+bot###@simulation.local`,
      }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // Check existing bot count
    const { count: existingCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_bot', true);
    
    console.log(`Found ${existingCount ?? 0} existing bots`);
    
    const results: BotCreationResult[] = [];
    const startIndex = (existingCount ?? 0) + 1;
    
    // Create bots in batches to avoid overwhelming the API
    const batchSize = 10;
    for (let i = 0; i < count; i += batchSize) {
      const batch = [];
      for (let j = i; j < Math.min(i + batchSize, count); j++) {
        batch.push(createBot(startIndex + j, prefix));
      }
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);
      
      // Small delay between batches
      if (i + batchSize < count) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    // Initialize simulation state if this is the first run
    if (succeeded > 0) {
      const { data: config } = await supabase
        .from('simulation_config')
        .select('id')
        .eq('name', 'default')
        .single();
      
      if (config) {
        await supabase
          .from('simulation_state')
          .upsert({
            config_id: config.id,
            counter_date: new Date().toISOString().split('T')[0],
          }, { onConflict: 'config_id' });
      }
    }
    
    return new Response(JSON.stringify({
      ok: true,
      created: succeeded,
      failed,
      total_bots: (existingCount ?? 0) + succeeded,
      results: results.slice(0, 20), // Only return first 20 for brevity
      truncated: results.length > 20,
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error('Seed bots error:', error);
    return new Response(JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
