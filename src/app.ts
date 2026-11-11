import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from './routes/authRoutes';
import chatRouter from './routes/chatRoutes';
import bodyParser from 'body-parser';

const app = express();

const corsOptions = {
    origin: ["http://localhost:8080", "http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  }

app.use(
  cors(corsOptions)
);
app.use(cookieParser());
app.use(express.json())
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use('/auth', authRouter);
app.use('/chat', chatRouter);

export default app;