import { env } from "./config/env.js";
import { dbConnect } from "./lib/db.js";
import { app } from "./app.js";

await dbConnect();

app.listen(env.PORT, () => {
  console.log(`server is running on port ${env.PORT}`);
});
