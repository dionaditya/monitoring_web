import { initTRPC } from "@trpc/server";
import { z } from "zod";

import {
  clientSchema,
  ClientsSchema,
  ClientType,
  query,
} from "./models/Clients.ts"; // Import the schema and type
import { Client } from "https://deno.land/x/mysql/mod.ts";
import { ConsoleHandler } from "https://deno.land/std@0.104.0/log/handlers.ts";
import { createClient } from 'npm:@supabase/supabase-js';

const t = initTRPC.create();
const router = t.router;
const publicProceducre = t.procedure;

const client = await new Client().connect({
  hostname: "127.0.0.1",
  username: "root",
  db: "snape_db",
  password: "adminadmin",
});

const supabaseUrl = 'https://smslhuphdqodyajevqhg.supabase.co'; // Replace with your Supabase URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtc2xodXBoZHFvZHlhamV2cWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjA0MDI2NTEsImV4cCI6MjAzNTk3ODY1MX0.AKuC62F2Z_uVdLdY3PF6anvjp6XjkEsvpm46sm7EMU4'; // Replace with your Supabase key
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize the clients table if it does not exist
const initTable = async () => {
  const { error } = await supabase
    .from('clients')
    .select('*')
    .limit(1);

  console.log(error)
  
  if (error) {
    await supabase.from('clients').insert([{
      id_pelanggan: '',
      client_name: '',
      cpe: '',
      port: '',
      service: '',
      latitude: 0,
      longitude: 0,
      address: '',
      pic_name: '',
      pic_email: '',
      registered_date: ''
    }]);
  }
};

await initTable();

function convertToMySQLDate(dateString: string) {
  // Split the date and time parts
  const [datePart, timePart] = dateString.split(", ");

  // Split the date part into month, day, and year
  const [month, day, year] = datePart.split("/").map((part) =>
    parseInt(part, 10)
  );

  // Ensure the date is valid
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    throw new Error("Invalid date");
  }

  // Format month and day to be two digits
  const formattedMonth = String(month).padStart(2, "0");
  const formattedDay = String(day).padStart(2, "0");

  // Return the formatted date as YYYY-MM-DD
  return `${year}-${formattedMonth}-${formattedDay}`;
}

export const appRouter = router({
  hello: publicProceducre.query(() => "world"),
  "clients.get": publicProceducre.query(async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*');
    
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const clients = data.map(({ registered_date, ...rest }) => {
      return {
        ...rest,
        registered_date: new Date(registered_date).toLocaleString(),
        latitude: Number(rest.latitude),
        longitude: Number(rest.longitude),
      };
    });

    try {
      const validatedClients = ClientsSchema.parse(clients) as any as ClientType[];
      return validatedClients;
    } catch (e) {
      return new Response(JSON.stringify({ error: e.errors }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
  "clients.create": publicProceducre
    .input(clientSchema)
    .mutation(async ({ input }) => {
      input.registered_date = convertToMySQLDate(input.registered_date);
      const { data, error } = await supabase
        .from('clients')
        .insert([input]);

      console.log(error, 'asu')
      
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      return data;
    }),
  "clients.delete": publicProceducre
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from('clients')
        .delete()
        .eq('id_pelanggan', input.id);
      
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      return data;
    }),
  "clients.update": publicProceducre
    .input(clientSchema)
    .mutation(async ({ input }) => {
      input.registered_date = convertToMySQLDate(input.registered_date);
      const { data, error } = await supabase
        .from('clients')
        .update(input)
        .eq('id_pelanggan', input.id_pelanggan);

      console.log(data, error)
      
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      return data;
    }),
});


export type AppRouter = typeof appRouter;