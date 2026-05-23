import { app } from "./app";
import { env } from "./config/env";

app.listen(env.port, () => {
  console.log(`Auth-service HandiTalents demarre sur le port ${env.port}.`);
});
