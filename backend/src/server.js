import { app } from "./app.js";
import { env } from "./config/env.js";

app.listen(env.port, () => {
  console.log(`BobMess API started on http://localhost:${env.port}`);
});