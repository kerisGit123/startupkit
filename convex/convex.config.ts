import { defineApp } from "convex/server";
import aggregate from "@convex-dev/aggregate/convex.config.js";

const app = defineApp();

// Storage aggregates — one namespace per companyId, with different sort keys
// to support breakdown by category and fileType in getStorageUsage.
app.use(aggregate, { name: "storageByCompany" });
app.use(aggregate, { name: "storageByCategory" });
app.use(aggregate, { name: "storageByFileType" });

export default app;
