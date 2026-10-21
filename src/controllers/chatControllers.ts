import db from "../db/db";
import cloudinary from '../config/cloudinary';
import PDFDocument from 'pdfkit';
import { Readable } from "stream";
import { getSender } from '../utils/getSender'

const createChat = async(req: any, res: any) => {
	try {
		const { senderId, receiverId, isRead, chatMessage, imageUrl } = req.body;

		if (!senderId || !receiverId || !chatMessage) {
			return res.status(401).json({error: 'Incomplete Unauthorized Request!'})
		}

		const sender = await db('client').where({client_id: senderId}).select('*').first();
		const receiver = await db('client').where({client_id: receiverId}).select('*').first();

		if (!sender) {
			return res.status(401).json({error: 'No valid sender'})
		}
		if (!receiver) {
			return res.status(401).json({error: 'No valid receiver'})
		}

		let uploadedImageLink = '';

		if (imageUrl) {
			const imageLink = await cloudinary.uploader.upload(imageUrl, {
				folder: "avatars",
				resource_type: "image"
			})
			uploadedImageLink = imageLink && imageLink.secure_url 
		}

		await db.transaction(async(trx) => {
			// START Transaction by logging sender's action
			await trx('client_history')
			.update({
				status: 'PENDING',
				report: 'Sending Chat Message'
			})
			.where({client_id: sender.client_id});
			
			// SAVEPOINTS 

			try {
				await trx.transaction(async(sp) => {
					const [newChat] = await sp('chat').insert({
						senderId,
						receiverId,
						isRead,
						chat_message: chatMessage,
						image_url: uploadedImageLink? uploadedImageLink: null
					})
					.returning('*');

					await sp('client_history').update({
						status: 'SUCCESS',
						report: 'Sent chat message successfully'
					})

					if (!newChat) {
						return res.status(400).json({error: "Chat Message creation failed!"})
					}
					return res.status(201).json({newChat, message: "Chat Message created successfully"})
				})
			} catch (error) {
				await trx('client_history')
				.update({
					status: 'FAILED',
					report: `Sending Failed: ${ error instanceof Error? error.message : error }`
				})
				.where({client_id: senderId});

				res.status(400).json({error: error instanceof Error? error.message: error})
			}
		})

	} catch (error) {
		res.status(500).json({error: error instanceof Error? error.message : error})
	}
}

const updateChat = async(req: any, res: any) => {
	try {
		const { chatId, status } = req.body;

		if (!chatId) {
			return res.status(401).json({error: 'Incomplete Unauthorized Request!'})
		}

		const chat = await db('chat').where({chat_id: chatId}).select('*').first();
		
		if (!chat) {
			return res.status(401).json({error: 'No valid chat'})
		}


		// await db.transaction(async(trx) => {
		// 	// START Transaction by logging sender's action
		// 	await trx('client_history')
		// 	.update({
		// 		status: 'PENDING',
		// 		report: 'Updating Chat Message'
		// 	})
		// 	.where({client_id: sender.client_id});
			
		// 	// SAVEPOINTS 

		// 	try {
		// 		await trx.transaction(async(sp) => {
					const [updatedChat] = await db('chat').update({
						isRead: status,
					}).where({chat_id: chatId})
					.returning('*');

					// await sp('client_history').update({
					// 	status: 'SUCCESS',
					// 	report: 'Sent chat message successfully'
					// })

					if (!updatedChat) {
						return res.status(400).json({error: "Chat Message update failed!"})
					}
					return res.status(201).json({updatedChat, message: "Chat Message created successfully"})
		// 		})
		// 	} catch (error) {
		// 		await trx('client_history')
		// 		.update({
		// 			status: 'FAILED',
		// 			report: `Sending Failed: ${ error instanceof Error? error.message : error }`
		// 		})
		// 		.where({client_id: senderId});

		// 		res.status(400).json({error: error instanceof Error? error.message: error})
		// 	}
		// })
	} catch (error) {
		console.error(error instanceof Error? error.message : error)
	}
}

const fetchChats = async(req: any, res: any) => {
	try {
		const senderId = req.params.senderId;
		const receiverId = req.params.receiverId;

		console.table({senderId, receiverId})

		if (!senderId || !receiverId) {
			return res.status(401).json({error: 'Unauthorized!'})
		}

		const sender = await db('client').where({client_id: senderId}).select('*').first();
		const receiver = await db('client').where({client_id: receiverId}).select('*').first();

		if (!sender || !receiver) {
			return res.status(401).json({error: 'Unauthorized!'})
		}

		const chats = await db('chat').where({
			senderId: sender.client_id, 
			receiverId: receiver.client_id
		}).orWhere({
			senderId: receiver.client_id, 
			receiverId: sender.client_id
		}).select('*');

		res.status(200).json({chats});
	} catch (error) {
		res.status(500).json({error: error instanceof Error? error.message : error})
	}
};

const downloadChats = async(req: any, res: any) => {
	try {
		const { chats, authUserId } = req.body;

		console.table({authUserId})

		if (!chats) {
			res.status(401).json({error: 'Provide valid chats'})
		}

		// const readableFromChats = Readable.from([chats], { objectMode: true });

			const confirmedChats = await db('chat').where({senderId: chats[0].senderId, receiverId: chats[0].receiverId}).orWhere({senderId: chats[0].receiverId, receiverId: chats[0].senderId}).select('*');

			const readableFromChats = Readable.from([confirmedChats], { objectMode: true });
		
		const doc = new PDFDocument();

		if (doc) {
			res.setHeader('Content-Type', 'application/pdf');
			res.setHeader('Content-Disposition', 'attachment; filename="output.pdf"');

			doc.pipe(res);

			const [ sender, receiver ] = await getSender(confirmedChats[0].senderId, confirmedChats[0].receiverId) as any;

			readableFromChats.on('data', (data) => {
				doc.fontSize(18).text(data[0].senderId === authUserId? `${sender.name} and ${receiver.name}` : `${receiver.name} and ${sender.name}`, {
					align: data[0].senderId === authUserId? 'right' : 'left'
				});
				
				doc.moveDown();
				renderMessages(data);
			})
			.on('end', () => {
				doc.end();
				console.log('PDF streamed successfully');
			})
			.on('error', (err) => {
				console.error(err);
				if (!res.headersSent) {
					res.status(500).send('Error generating PDF');
				}
			});
			
			// ✅ Extract message rendering
			function renderMessages(data:any) {
				data.forEach((d: {senderId: string, receiverId: string, chat_message: string}, indx: number) => {
					const isSender = d.senderId === authUserId;
					doc.fontSize(12).text(d.chat_message ?? '', {
						align: isSender ? 'right' : 'left'
					});
					doc.moveDown(0.5);
				});
			}
		}

	} catch (error) {
		return res.status(500).json({error: error instanceof Error? error.message : error})
	}
}

export { createChat, fetchChats, updateChat, downloadChats }