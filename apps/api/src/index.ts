import { app } from './app.js';

const PORT = Number(process.env.PORT || 4000);

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server is listening at http://127.0.0.1:${PORT}`);
});
