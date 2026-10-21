import { Router } from 'express';
import { createChat, downloadChats, fetchChats, updateChat } from '../controllers/chatControllers';

const chatRouter = Router();

// chatRouter.get('/:id', validateToken, fetchUser);
chatRouter.get('/:senderId/:receiverId',  fetchChats);
chatRouter.post('/', createChat);
chatRouter.put('/', updateChat);
chatRouter.post('/download', downloadChats);

export default chatRouter;
