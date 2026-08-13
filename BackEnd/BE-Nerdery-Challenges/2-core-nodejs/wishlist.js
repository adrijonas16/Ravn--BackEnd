#!/usr/bin/env node

/**
 * Wishlist Tracker CLI
 *
 * A command-line tool for managing a personal wishlist.
 * Uses only built-in Node.js modules (fs, path, process).
 *
 * Usage:
 *   node wishlist.js add --name "Item" --price 99.99 --store "Store"
 *   node wishlist.js list
 *   node wishlist.js update --id 1 [--name "New"] [--price 50] [--store "New"]
 *   node wishlist.js delete --id 1
 *   node wishlist.js summary
 *   node wishlist.js export
 */

const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// Data persistence
// ---------------------------------------------------------------------------

const DATA_FILE = path.join(__dirname, "wishlist.json");

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    return { nextId: 1, items: [] };
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { nextId: 1, items: [] };
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const raw = argv[i].slice(2);
      const eqIndex = raw.indexOf("=");
      if (eqIndex !== -1) {
        // Handle --name=value syntax
        const key = raw.slice(0, eqIndex);
        args[key] = raw.slice(eqIndex + 1);
      } else {
        const key = raw;
        const next = argv[i + 1];
        if (next !== undefined && !next.startsWith("--")) {
          args[key] = next;
          i++;
        } else {
          args[key] = true;
        }
      }
    }
  }
  return args;
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function validatePrice(value) {
  const price = Number(value);
  if (isNaN(price) || price < 0) {
    return null;
  }
  return Math.round(price * 100) / 100;
}

function validateId(data, idStr) {
  const id = Number(idStr);
  if (!Number.isInteger(id) || id < 1) {
    console.error(`Error: "${idStr}" is not a valid ID.`);
    return null;
  }
  const item = data.items.find((i) => i.id === id);
  if (!item) {
    console.error(`Error: No item found with ID ${id}.`);
    return null;
  }
  return item;
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

function cmdAdd(data, args) {
  const { name, price, store } = args;

  if (!name) {
    console.error("Error: --name is required.");
    process.exit(1);
  }
  if (price === undefined) {
    console.error("Error: --price is required.");
    process.exit(1);
  }
  if (!store) {
    console.error("Error: --store is required.");
    process.exit(1);
  }

  const parsedPrice = validatePrice(price);
  if (parsedPrice === null) {
    console.error(`Error: "${price}" is not a valid price.`);
    process.exit(1);
  }

  const item = {
    id: data.nextId++,
    name: String(name),
    price: parsedPrice,
    store: String(store),
  };

  data.items.push(item);
  saveData(data);
  console.log(`Added item #${item.id}: "${item.name}" - $${item.price.toFixed(2)} at ${item.store}`);
}

function cmdList(data) {
  if (data.items.length === 0) {
    console.log("Your wishlist is empty.");
    return;
  }

  console.log("\n  Your Wishlist");
  console.log("  " + "-".concat("".padEnd(58, "-")));

  for (const item of data.items) {
    const id = String(item.id).padStart(3);
    const name = item.name.slice(0, 25).padEnd(25);
    const price = ("$" + item.price.toFixed(2)).padStart(10);
    const store = item.store;
    console.log(`  ${id}. ${name} ${price}   ${store}`);
  }

  console.log(`\n  ${data.items.length} item(s)\n`);
}

function cmdUpdate(data, args) {
  if (!args.id) {
    console.error("Error: --id is required.");
    process.exit(1);
  }

  const item = validateId(data, args.id);
  if (!item) process.exit(1);

  let changed = false;

  if (args.name !== undefined) {
    item.name = String(args.name);
    changed = true;
  }

  if (args.price !== undefined) {
    const parsedPrice = validatePrice(args.price);
    if (parsedPrice === null) {
      console.error(`Error: "${args.price}" is not a valid price.`);
      process.exit(1);
    }
    item.price = parsedPrice;
    changed = true;
  }

  if (args.store !== undefined) {
    item.store = String(args.store);
    changed = true;
  }

  if (!changed) {
    console.log("Nothing to update. Provide at least one of --name, --price, or --store.");
    return;
  }

  saveData(data);
  console.log(`Updated item #${item.id}: "${item.name}" - $${item.price.toFixed(2)} at ${item.store}`);
}

function cmdDelete(data, args) {
  if (!args.id) {
    console.error("Error: --id is required.");
    process.exit(1);
  }

  const item = validateId(data, args.id);
  if (!item) process.exit(1);

  data.items = data.items.filter((i) => i.id !== item.id);
  saveData(data);
  console.log(`Deleted item #${item.id}: "${item.name}"`);
}

function cmdSummary(data) {
  if (data.items.length === 0) {
    console.log("Your wishlist is empty. Nothing to summarize.");
    return;
  }

  const total = data.items.reduce((sum, i) => sum + i.price, 0);
  const avg = total / data.items.length;
  const mostExpensive = data.items.reduce((max, i) => (i.price > max.price ? i : max), data.items[0]);
  const cheapest = data.items.reduce((min, i) => (i.price < min.price ? i : min), data.items[0]);

  console.log("\n  Wishlist Summary");
  console.log("  " + "-".concat("".padEnd(40, "-")));
  console.log(`  Items:           ${data.items.length}`);
  console.log(`  Total cost:      $${total.toFixed(2)}`);
  console.log(`  Average price:   $${avg.toFixed(2)}`);
  console.log(`  Most expensive:  "${mostExpensive.name}" ($${mostExpensive.price.toFixed(2)})`);
  console.log(`  Cheapest:        "${cheapest.name}" ($${cheapest.price.toFixed(2)})`);
  console.log();
}

function cmdExport(data) {
  if (data.items.length === 0) {
    console.log("Your wishlist is empty. Nothing to export.");
    return;
  }

  const csvPath = path.join(__dirname, "wishlist.csv");
  const lines = ["name,price,store"];

  for (const item of data.items) {
    // Escape fields that contain commas or quotes
    const escapeCsv = (val) => {
      const str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };
    lines.push(`${escapeCsv(item.name)},${item.price.toFixed(2)},${escapeCsv(item.store)}`);
  }

  fs.writeFileSync(csvPath, lines.join("\n") + "\n", "utf-8");
  console.log(`Exported ${data.items.length} item(s) to ${csvPath}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function printUsage() {
  console.log(`
  Wishlist Tracker - Manage your personal wishlist

  Usage:
    node wishlist.js <command> [options]

  Commands:
    add      Add a new item
               --name "Item name"  (required)
               --price 99.99       (required)
               --store "Store"     (required)

    list     Show all items in the wishlist

    update   Update an existing item
               --id 1              (required)
               --name "New name"   (optional)
               --price 50          (optional)
               --store "New store" (optional)

    delete   Remove an item
               --id 1              (required)

    summary  Show wishlist statistics

    export   Export wishlist to CSV
`);
}

function main() {
  const command = process.argv[2];
  const args = parseArgs(process.argv.slice(3));
  const data = loadData();

  switch (command) {
    case "add":
      cmdAdd(data, args);
      break;
    case "list":
      cmdList(data);
      break;
    case "update":
      cmdUpdate(data, args);
      break;
    case "delete":
      cmdDelete(data, args);
      break;
    case "summary":
      cmdSummary(data);
      break;
    case "export":
      cmdExport(data);
      break;
    case "help":
    case "--help":
    case "-h":
      printUsage();
      break;
    default:
      if (command) {
        console.error(`Unknown command: "${command}"`);
      }
      printUsage();
      process.exit(1);
  }
}

main();
