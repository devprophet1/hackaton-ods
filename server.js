// Arranque local de Express. En Vercel se usa api/index.js.
import app from './server/app.js';

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`API de Rimay en http://localhost:${port}/api`));
