import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { SupabaseClient ,createClient } from '@supabase/supabase-js';
@Injectable()
export class DatabaseService {

  public readonly pool: Pool;
  public readonly supabase: SupabaseClient;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    console.log('connected to postgres')
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {auth: {
          flowType: 'pkce',
          autoRefreshToken: false,
          persistSession: false,
        },}
    );
    console.log('NestJS Worker connected successfully to Supabase PostgreSQL');
  }

}
