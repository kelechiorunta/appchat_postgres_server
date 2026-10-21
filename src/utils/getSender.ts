import db from '../db/db';

export const getSender = async (senderId: any, receiverId: any): Promise<[sender:any, receiver: any] | null> => {
	const valid_sender = db('client').where({client_id: senderId}).first();
	const valid_receiver = db('client').where({client_id: receiverId}).first();
	try {
		const [sender, receiver] = await Promise.all([valid_sender, valid_receiver]);
		return [sender, receiver ]
	} catch (error) {
		if (error instanceof Error) {
			console.error(error.message)
		}
		console.error(error)
		return null;
	}
};