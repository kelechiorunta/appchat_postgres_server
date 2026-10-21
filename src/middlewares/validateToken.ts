import jwt from 'jsonwebtoken';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({
  path: path.resolve(__dirname, '../.env')
});

const validateToken = async (req: any, res: any, next: any) => {
  try {
    const token = req.cookies['remember_me'];

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized!',
      });
    }

    const decodedToken = jwt.verify(
      token as string,
      process.env.SESSION_SECRET as string
    );

    console.log("SECRET", process.env.SESSION_SECRET)

    req.user = decodedToken;

    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid or expired token',
    });
  }
};

export default validateToken;