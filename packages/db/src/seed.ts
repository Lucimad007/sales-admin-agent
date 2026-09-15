import path from "node:path";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { eq } from "drizzle-orm";
import { createDb } from "./client";
import { customers, sales, users } from "./schema";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
dotenv.config();

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is required");
}

const { db, client } = createDb(url);

const DEMO_EMAIL = "leo.a@example.org";
const DEMO_PASSWORD = "demo1234";

const customerSeed = [
  ["Amelia", "Chen", "415-555-0142", "amelia.chen@northwind.co", "88 Market St, San Francisco, CA"],
  ["Marcus", "Webb", "212-555-0177", "marcus.webb@harborline.com", "19 Pier 4, Brooklyn, NY"],
  ["Priya", "Nair", "617-555-0190", "priya.nair@lumenlabs.io", "4 Athena Row, Cambridge, MA"],
  ["Jonah", "Hale", "512-555-0118", "jonah.hale@oakandiron.com", "230 Congress Ave, Austin, TX"],
  ["Elena", "Voss", "206-555-0133", "elena.voss@cascade.systems", "91 Pine St, Seattle, WA"],
  ["Diego", "Alvarez", "305-555-0164", "diego.alvarez@coralbank.co", "15 Brickell Ave, Miami, FL"],
  ["Hannah", "Brooks", "303-555-0181", "hannah.brooks@ridgewell.com", "440 Larimer St, Denver, CO"],
  ["Kenji", "Mori", "503-555-0129", "kenji.mori@cedarform.jp", "70 NW 9th Ave, Portland, OR"],
  ["Sofia", "Rahman", "312-555-0156", "sofia.rahman@fieldnote.co", "200 W Madison, Chicago, IL"],
  ["Luca", "Bianchi", "215-555-0104", "luca.bianchi@velluto.it", "12 Rittenhouse Sq, Philadelphia, PA"],
  ["Nora", "Feldman", "919-555-0172", "nora.feldman@paperlane.com", "8 West St, Durham, NC"],
  ["Owen", "Clarke", "602-555-0148", "owen.clarke@sundial.agency", "33 Roosevelt St, Phoenix, AZ"],
] as const;

type Status = "new" | "in_progress" | "completed" | "cancelled";

const saleSeed: Array<{
  customerIndex: number;
  productName: string;
  price: string;
  status: Status;
  notes: string;
}> = [
  { customerIndex: 0, productName: "Annual CRM seat bundle", price: "4800.00", status: "completed", notes: "Renewed two weeks early." },
  { customerIndex: 0, productName: "Onboarding workshop", price: "1800.00", status: "in_progress", notes: "Waiting on attendee list." },
  { customerIndex: 1, productName: "Warehouse integration", price: "9200.00", status: "new", notes: "Needs security review." },
  { customerIndex: 1, productName: "Support retainer Q3", price: "3600.00", status: "completed", notes: "Paid in full." },
  { customerIndex: 2, productName: "Data room cleanup", price: "2400.00", status: "in_progress", notes: "Priya asked for Friday demo." },
  { customerIndex: 2, productName: "Executive briefing", price: "950.00", status: "cancelled", notes: "Conflicted with board offsite." },
  { customerIndex: 3, productName: "Custom report pack", price: "1250.00", status: "completed", notes: "Delivered." },
  { customerIndex: 3, productName: "Field tablet rollout", price: "6400.00", status: "new", notes: "Quote sent." },
  { customerIndex: 4, productName: "SOC2 evidence export", price: "2100.00", status: "in_progress", notes: "Legal is reviewing DPA." },
  { customerIndex: 4, productName: "Legacy import", price: "4100.00", status: "completed", notes: "CSV mapping signed off." },
  { customerIndex: 5, productName: "Spanish locale pack", price: "800.00", status: "new", notes: "Small add-on." },
  { customerIndex: 5, productName: "Branch launch kit", price: "5400.00", status: "in_progress", notes: "Kickoff scheduled." },
  { customerIndex: 6, productName: "Forecast model", price: "3200.00", status: "completed", notes: "Used in QBR." },
  { customerIndex: 6, productName: "Enablement sprint", price: "2700.00", status: "cancelled", notes: "Budget freeze." },
  { customerIndex: 7, productName: "API concierge", price: "1500.00", status: "new", notes: "Kenji wants sandbox first." },
  { customerIndex: 7, productName: "Design system audit", price: "1900.00", status: "completed", notes: "Follow-up in October." },
  { customerIndex: 8, productName: "Content ops desk", price: "2200.00", status: "in_progress", notes: "Need brand kit." },
  { customerIndex: 8, productName: "Analytics warehouse", price: "7800.00", status: "new", notes: "Waiting on Snowflake access." },
  { customerIndex: 9, productName: "Showroom kiosk", price: "4300.00", status: "completed", notes: "Installed last Thursday." },
  { customerIndex: 9, productName: "Holiday campaign", price: "2600.00", status: "cancelled", notes: "Moved in-house." },
  { customerIndex: 10, productName: "Editorial CMS", price: "5100.00", status: "in_progress", notes: "Nora prefers weekly check-ins." },
  { customerIndex: 10, productName: "Archive digitization", price: "3400.00", status: "new", notes: "Scope still draft." },
  { customerIndex: 11, productName: "Brand film stills", price: "1600.00", status: "completed", notes: "Licensed for web." },
  { customerIndex: 11, productName: "Retainer expansion", price: "4800.00", status: "cancelled", notes: "Paused until FY start." },
];

const existing = await db.query.users.findFirst({ where: eq(users.email, DEMO_EMAIL) });
if (existing) {
  console.log("seed already applied");
  await client.end();
  process.exit(0);
}

const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

const [user] = await db
  .insert(users)
  .values({ email: DEMO_EMAIL, passwordHash, name: "Demo Seller" })
  .returning();

if (!user) {
  throw new Error("failed to insert demo user");
}

const insertedCustomers = await db
  .insert(customers)
  .values(
    customerSeed.map(([firstName, lastName, phone, email, address]) => ({
      firstName,
      lastName,
      phone,
      email,
      address,
      createdBy: user.id,
    })),
  )
  .returning();

await db.insert(sales).values(
  saleSeed.map((row) => {
    const customer = insertedCustomers[row.customerIndex];
    if (!customer) {
      throw new Error(`missing customer at ${row.customerIndex}`);
    }
    return {
      customerId: customer.id,
      productName: row.productName,
      price: row.price,
      status: row.status,
      notes: row.notes,
      createdBy: user.id,
    };
  }),
);

console.log(`seeded ${insertedCustomers.length} customers and ${saleSeed.length} sales`);
await client.end();
