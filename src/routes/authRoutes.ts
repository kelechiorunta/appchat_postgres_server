import { Router } from 'express';
import { upload } from '../config/multer';
import { editClient, fetchClients, fetchUser, getLoginUser, getLogoutUser } from '../controllers/authControllers';
import validateToken from '../middlewares/validateToken';

const authRouter = Router();

authRouter.get('/:id', validateToken, fetchUser);
authRouter.get('/login/user/:id', getLoginUser);
authRouter.get('/logout/user/:id', getLogoutUser);
authRouter.get('/clients/:id',  fetchClients);
authRouter.post('/edit', upload.single('avatar'), editClient);

export default authRouter;
