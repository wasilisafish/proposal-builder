import "dotenv/config";
import { createServer } from "./index";

const app = createServer();
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`🚀 Express server running on port ${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
});
