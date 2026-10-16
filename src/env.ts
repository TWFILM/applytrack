import "server-only";

import { parseServerEnv } from "@/lib/schemas/env";

// Validated once at startup so a missing variable fails loudly instead of at first query.
export const env = parseServerEnv(process.env);
