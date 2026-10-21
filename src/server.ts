import app from './app';
import { createServer } from 'http';
import { createDBConnection } from './db/db'

const server = createServer(app);
const PORT = 5467;
createDBConnection();

server.listen(PORT, () => console.log(`Server is listening at PORT ${PORT}`))

