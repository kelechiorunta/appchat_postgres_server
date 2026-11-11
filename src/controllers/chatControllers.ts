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
		}).select('*').orderBy('chat_id');

		res.status(200).json({chats});
	} catch (error) {
		res.status(500).json({error: error instanceof Error? error.message : error})
	}
};

const clearUnreadChats = async(req: any, res: any) => {
	try {
		const { senderId, receiverId } = req.body;
		if (!senderId || !receiverId) {
			return res.status(401).json({error: 'Unauthorized'})
		}
		const clearedChats = await db('chat').where({senderId, receiverId, isRead: false}).update({isRead: true}).returning('*');

		if (clearedChats) {
			return res.status(200).json({clearedChats})
		}
	} catch (error) {
		res.status(500).json({error: error instanceof Error? error.message : error})
	}
}

const fetchUnreadChatMsgs = async(req: any, res: any) => {
	try {
		const unReadMsgs = await db('chat').where({isRead: false}).select('*');

		if (unReadMsgs) {
			console.table(unReadMsgs)
			return res.status(200).json({unReadMsgs})
		}

		return res.status(200).json([])
	} catch (error) {
		res.status(500).json({error: error instanceof Error? error.message : error})
	}
}

const createGroup = async(req: any, res: any) => {
	try {
		const { name, membersIds } = req.body;
		if (!name ||  !membersIds) {
			return res.status(401).json({error: 'Unauthorized'})
		}

		const uniqueIds = Array.from(new Set(membersIds)) as string[];

		console.table({name, ids: uniqueIds})

		const result = await db.transaction(async(trx) => {

			const existingMembers = await trx('client')
			.select('client_id')
			.whereIn('client_id', uniqueIds);
			
			if (existingMembers.length !== uniqueIds.length) {
				throw new Error('One or more member IDs do not exist.');
			}

			const [group] = await trx('group_chat').insert({name}).returning('*');
			
			if (group) {
				const groupMembers = await trx('group_chat_members')
				.insert(uniqueIds.map((clientId) => ({
					client_id: String(clientId),
					group_chat_id: group.group_chat_id,
				}))).returning('*');
				
				return {groupId: group.group_chat_id, name: group.name, groupMembers}
			}
		})

		return res.status(201).json({result})

	} catch (error) {
		res.status(500).json({error: error instanceof Error? error.message : error})
	}
}

const addGroupMember = async(req: any, res: any) => {
	try {
		const { groupId, membersIds } = req.body;

		if (!groupId || !membersIds) {
			return res.status(401).json({error: 'Unauthorized'})
		}

		const uniqueIds = Array.from(new Set(membersIds)) as string[];

		const result = await db.transaction(async(trx) => {

			const existingMembers = await trx('client')
			.select('client_id')
			.whereIn('client_id', uniqueIds);
			
			if (existingMembers.length !== uniqueIds.length) {
				throw new Error('One or more member IDs do not exist.');
			}

			const [group] = await trx('group_chat').where({group_chat_id: groupId}).select('*');

			if (!group) {
				return res.status(401).json({error: 'No authorized group'})
			}

			const addedGroupMembers = await trx('group_chat_members').insert(
				uniqueIds.map((clientId) => ({
					client_id: String(clientId),
					group_chat_id: group.group_chat_id,
				}))).where({group_chat_id: group.group_chat_id})
				.returning('*');

			return { updatedGroupMembers: addedGroupMembers}

		})

		return res.status(200).json({result})
	} catch (error) {
		res.status(500).json({error: error instanceof Error? error.message : error})
	}
}

const deleteGroupMember = async(req: any, res: any) => {
	try {
		const {groupId, clientIds} = req.body;

		if (!groupId || !clientIds) {
			return res.status(401).json({error: 'Unauthorized'})
		}

		const uniqueIds = Array.from(new Set(clientIds)) as string[];

		const result = await db.transaction(async(trx) => {
			const [group] = await trx('group_chat').where({group_chat_id: groupId}).select('*');
			
			if (!group) {
				return res.status(404).json({error: 'Non-existent group'})
			}

			const existingClients = await trx('client').select('client_id').whereIn('client_id', uniqueIds);

			if (existingClients.length !== uniqueIds.length) {
				throw new Error('One or more client does not exist');
			}

			const deleteClient = await trx('group_chat_members')
			.where('group_chat_id', group.group_chat_id)
			.whereIn('client_id', uniqueIds.map((clientId) => String(clientId)))
			.delete();

			return {status: true, client: deleteClient}
		})

		return res.status(204).json({result})
	} catch (error) {
		res.status(500).json({error: error instanceof Error? error.message : error})
	}
}

const fetchGroupChat = async(req: any, res: any) => {
	try {
		// FETCH A GROUP BASED ON ITS ID
		const groupId  = req.params.groupId;

		console.log("GROUP_ID", groupId)

		if (!groupId) {
			return res.status(401).json({error: 'Unauthorized'})
		}

		const result = await db.transaction(async(trx) => {
			const [group] = await trx('group_chat').where({group_chat_id: groupId}).select('*');

			if (!group) {
				throw new Error('Non-existent group')
			}

			const groupChatMembers = await trx.select(
				'group_chat_members.group_chat_id AS groupId',
				'group_chat_members.client_id AS clientId',
				'client.name AS client_name',
				'group_chat.name AS group_name',	
			).from('group_chat')
			.where('group_chat.name', '=', group.name)
			.join('group_chat_members', 'group_chat_members.group_chat_id', '=',  group.group_chat_id)
			.join('client', 'client.client_id', '=', 'group_chat_members.client_id')
			

			if (groupChatMembers) {
				const ids = Array.from(new Set(groupChatMembers.map(member => member.clientId)));
				const members = Array.from(new Set(groupChatMembers.map(member => member.client_name)));
				console.table({groupChatMembers})
				return {groupChat: groupChatMembers.map(member => ({groupId: member.groupId, groupName: member.group_name, membersIds: ids, members: members})).reduce(({groupId, groupName, membersIds, members}) => ({groupId, groupName, membersIds, members}))
			}
		}
			
		})

		return res.status(200).json(result)

	} catch (error) {
		res.status(500).json({error: error instanceof Error? error.message : error})
	}
}

const fetchGroupChats = async(req: any, res: any) => {
	try {
		// FETCH ALL GROUPS
		const result = await db.transaction(async(trx) => {
			const groups = await trx('group_chat').select('*');

			if (!groups) {
				throw new Error('Non-existent groups')
			}

			const groupChatMembers = await trx.select(
				'group_chat_members.group_chat_id AS groupId',
				'group_chat_members.client_id AS clientId',
				'client.name AS client_name',
				'group_chat.name AS group_name',	
			).from('group_chat')
			.whereIn('group_chat.name', groups.map(group => group.name))
			.whereIn('group_chat_members.group_chat_id', groups.map(group => group.group_chat_id))
			.join('group_chat_members', 'group_chat_members.group_chat_id', '=',  'group_chat.group_chat_id')
			.join('client', 'client.client_id', '=', 'group_chat_members.client_id')
			

			if (groupChatMembers) {
				const ids = Array.from(new Set(groupChatMembers.filter(member => member.clientId && member.groupId)));
				const members = Array.from(new Set(groupChatMembers.map(member => member.client_name)));
				console.table({groupChatMembers})

				const groupedChats = Object.values(groupChatMembers.reduce((acc, chat) => {
					const { groupId, clientId, client_name, group_name } = chat;
					
					if (!acc[groupId]) {
						acc[groupId] = {
							groupId, 
							name: group_name,
							membersIds: [],
							members: [],
						};
					}
					
					acc[groupId].membersIds.push(clientId);
					acc[groupId].members.push(client_name);
					
					return acc;
				}, {} as Record<number, {
					groupId: number;
					name: string;
					membersIds: string[];
					members: string[];
				}>)
			);
			console.log(groupedChats);
				return { groupedChats }
		}
			
		})

		return res.status(200).json(result)

	} catch (error) {
		res.status(500).json({error: error instanceof Error? error.message : error})
	}
}

const fetchGroupChatMessages = async(req: any, res: any) => {
	try {
		const groupId  = req.params.groupId;

		console.log("GROUPID", groupId)

		if (!groupId) {
			return res.status(401).json({error: 'Unauthorized'})
		}

		const result = await db.transaction(async(trx) => {
			const [group] = await trx('group_chat').where({group_chat_id: groupId}).select('*');

			if (!group) {
				throw new Error('Non-existent group')
			}

			const groupChatMessages = await trx.select(
				'group_chat_message.message',
				'group_chat_message.client_id AS clientId',
				'client.name AS sender',
				'group_chat_message.updated_at AS updatedAt',
			).from('group_chat_message')
			.join('group_chat', 'group_chat_message.group_chat_id', group.group_chat_id)
			.join('client', 'client.client_id', '=', 'group_chat_message.client_id')

			if (groupChatMessages) {
				return {groupChatMessages: Object.values(groupChatMessages.reduce((acc, {message, clientId, sender, updatedAt}, index) => {
					if (!acc[message]) {
						acc[message] = {
							message,
							clientId,
							sender,
							updatedAt
						}				
					}
					return acc
				}, {} as Record<number, {
					message: string;
					clientId: string;
					sender: string;
					updatedAt: string;
				}>
			))}
			}
			
		})

		return res.status(200).json(result)

	} catch (error) {
		res.status(500).json({error: error instanceof Error? error.message : error})
	}
}

const createGroupChat = async(req: any, res: any) => {
	try {
		const { groupMessage, senderId, groupId } = req.body;

		if (!groupMessage || !senderId || !groupId) {
			return res.status(401).json({error: 'Unauthorized'})
		}

		const result = await db.transaction(async(trx) => {
			const [group] = await trx('group_chat').where({group_chat_id: groupId}).select('*');
			const groupMembers = await trx('group_chat_members').where({group_chat_id: group.group_chat_id}).select('*');

			if (!groupMembers) {
				throw new Error('No group members for this group')
			}

			const sender = groupMembers.find(member => member.client_id === senderId);

			if (!sender) {
				throw new Error("Wrong senderId. Sender is not a group member");
			}

			const [newGroupMessage] = await trx('group_chat_message').insert({
				message: groupMessage,
				group_chat_id: group.group_chat_id,
				client_id: sender.client_id,
			}).where({group_chat_id: group.group_chat_id})
			.whereIn('client_id', groupMembers.map(member => String(member.client_id)))
			.returning('*');

			if (newGroupMessage) {
				return {newGroupMessage}
			}

		})

		return res.status(201).json(result)

	} catch (error) {
		res.status(500).json({error: error instanceof Error? error.message : error})
	}
}


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

export { createChat, fetchChats, updateChat, createGroup, addGroupMember, createGroupChat, fetchGroupChat, fetchGroupChats,fetchGroupChatMessages, downloadChats, clearUnreadChats, deleteGroupMember, fetchUnreadChatMsgs }