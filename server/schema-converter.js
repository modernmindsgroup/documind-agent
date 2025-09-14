#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the current schema file
const schemaPath = path.join(__dirname, '../shared/schema.ts');
let schemaContent = fs.readFileSync(schemaPath, 'utf8');

console.log('Converting PostgreSQL schema to SQLite...');

// Replace imports
schemaContent = schemaContent.replace(
  'import { pgTable, text, varchar, timestamp, jsonb, boolean, integer, decimal, uniqueIndex, index } from "drizzle-orm/pg-core";',
  'import { sqliteTable, text, integer, real, blob } from "drizzle-orm/sqlite-core";'
);

// Convert all pgTable to sqliteTable
schemaContent = schemaContent.replace(/pgTable\(/g, 'sqliteTable(');

// Convert varchar to text
schemaContent = schemaContent.replace(/varchar\(/g, 'text(');

// Convert timestamp to integer with mode
schemaContent = schemaContent.replace(
  /timestamp\("([^"]+)"\)\.defaultNow\(\)/g,
  'integer("$1", { mode: "timestamp" }).$defaultFn(() => new Date())'
);

// Convert boolean to integer with mode
schemaContent = schemaContent.replace(
  /boolean\("([^"]+)"\)\.default\((true|false)\)/g,
  'integer("$1", { mode: "boolean" }).default($2)'
);

schemaContent = schemaContent.replace(
  /boolean\("([^"]+)"\)/g,
  'integer("$1", { mode: "boolean" })'
);

// Convert UUID defaults
schemaContent = schemaContent.replace(
  /\.default\(sql`gen_random_uuid\(\)`\)/g,
  '.$default(() => crypto.randomUUID())'
);

// Convert jsonb to text
schemaContent = schemaContent.replace(/jsonb\(/g, 'text(');

// Convert decimal to real
schemaContent = schemaContent.replace(/decimal\(/g, 'real(');

// Write the converted schema
fs.writeFileSync(schemaPath, schemaContent);
console.log('Schema converted successfully!');