import { Router } from 'express';
import { clearUnreadChats, createChat, createGroup, deleteGroupMember, downloadChats, addGroupMember, fetchChats, fetchGroupChat, fetchUnreadChatMsgs, updateChat, createGroupChat, fetchGroupChatMessages, fetchGroupChats } from '../controllers/chatControllers';

const chatRouter = Router();

// chatRouter.get('/:id', validateToken, fetchUser);
chatRouter.get('/unReadMsgs', fetchUnreadChatMsgs);
chatRouter.get('/group/:groupId',  fetchGroupChat);
chatRouter.get('/groups',  fetchGroupChats);
chatRouter.get('/groupMessages/:groupId',  fetchGroupChatMessages);
chatRouter.get('/:senderId/:receiverId',  fetchChats);
chatRouter.post('/', createChat);
chatRouter.post('/group', createGroup);
chatRouter.post('/groupChat', createGroupChat);
chatRouter.post('/groupMember', addGroupMember);
chatRouter.delete('/groupMember', deleteGroupMember);
chatRouter.put('/', updateChat);
chatRouter.post('/download', downloadChats);
chatRouter.post('/clearUnreadMsgs', clearUnreadChats)

export default chatRouter;
