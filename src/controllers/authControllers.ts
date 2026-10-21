import db from "../db/db";
import cloudinary from '../config/cloudinary';
import dotenv from 'dotenv';
import path from "path";
import axios from "axios";

dotenv.config({
	path: path.resolve(__dirname, '../.env')
});

const getLoginUser = async(req: any, res: any) => {
	try {
    const clientId = req.params.id;

    console.log("LOGIN_USER_ID", clientId)

    if (!clientId) {
      return res.status(401).json({error: 'Unauthorized!'})
    }

    const client = await db('client').where({client_id: clientId}).select('*').first();

    if (!client) {
      return res.status(401).json({error: 'No valid authorized client!'})
    }

    const clientHistory = await db('client_history').where({client_id: client.client_id}).select('*').first();

    await db.transaction(async(trx) => {
      await trx('client_history')
      .where({client_id: client.client_id})
      .update({
        status: 'PENDING',
        report: 'Verifying Client'
      })

      try {
        await trx.transaction(async(sp) => {
          const [onlineClient] = await sp('client')
          .where({client_id: client.client_id})
          .update({isOnline: true})
          .returning('*');

          await sp('client_history')
          .where({client_id: client.client_id})
          .update({
            status: 'SUCCESS',
            report: 'Client Online Status Verified'
          })

          res.status(200).json({user: onlineClient})
        })
      } catch (error) {
        await trx('client_history')
        .where({client_id: client.client_id})
        .update({
          status: 'FAILED',
          report: `Failed to update client online status: ${error instanceof Error? error.message : error}`
        })
      }
    })
	} catch (error) {
		res.status(500).json({error: error instanceof Error? error.message : error})
	}
}

const getLogoutUser = async(req: any, res: any) => {
	try {
    const clientId = req.params.id;

    console.log("LOGOUT_USER_ID", clientId)

    if (!clientId) {
      return res.status(401).json({error: 'Unauthorized!'})
    }

    const client = await db('client').where({client_id: clientId}).select('*').first();
    console.log("CLIENT", client)

    if (!client) {
      return res.status(401).json({error: 'No valid authorized client!'})
    }

    const clientHistory = await db('client_history').where({client_id: client.client_id}).select('*').first();

    await db.transaction(async(trx) => {
      await trx('client_history')
      .where({client_id: client.client_id})
      .update({
        status: 'PENDING',
        report: 'Verifying Client'
      })

      try {
        await trx.transaction(async(sp) => {
          const [onlineClient] = await sp('client')
          .where({client_id: client.client_id})
          .update({isOnline: false})
          .returning('*');

          await sp('client_history')
          .where({client_id: client.client_id})
          .update({
            status: 'SUCCESS',
            report: 'Client Online Status Verified'
          })

          res.status(200).json({user: onlineClient})
        })
      } catch (error) {
        await trx('client_history')
        .where({client_id: client.client_id})
        .update({
          status: 'FAILED',
          report: `Failed to update client online status: ${error instanceof Error? error.message : error}`
        })
      }
    })
	} catch (error) {
		res.status(500).json({error: error instanceof Error? error.message : error})
	}
}

// const editClient = async(req: any, res: any) => {
//   try {
// 	const { clientId, username, email, phone, address } = req.body;
// 	const file = req.file;

// 	console.table("Avatar", file)

// 	if (!clientId || !username || !email ) {
// 		return res.status(400).json({error: 'Incomplete entries'});
// 	}

// 	 if (!file) {
//       return res.status(400).json({
//         error: "Avatar file is required",
//       });
//     }

// 	await db.transaction(async(trx) => {
// 		const history = await trx('client_history')
//         .where({
//           client_id: clientId,
//         })
//         .returning('*').first();

// 		try {
// 		await trx.transaction(async(sp) => {
// 			// Upload Buffer to Cloudinary
//                const avatarResult = await new Promise<any>((resolve, reject) => {
//                  const uploadStream = cloudinary.uploader.upload_stream(
//                    {
//                      folder: "avatars",
//                      resource_type: "image",
//                    },
//                    (error, result) => {
//                      if (error) {
//                        reject(error);
//                      } else {
//                        resolve(result);
//                      }
//                    }
//                  );
           
//                  uploadStream.end(file.buffer);
//                });
           
//                console.log("Cloudinary URL:", avatarResult.secure_url);
// 			// const avatar_url = await cloudinary.uploader.upload(buffer, {
// 			// 	folder: "avatars",
// 			// 	resource_type: "image"
// 			// });

// 			// console.log("URL", avatar_url)

// 			const [client] = await sp('client').update({
// 				name: username,
// 				email,
// 				phone,
// 				address,
// 				avatar_url: avatarResult.secure_url,
// 			}).where({
// 				client_id: clientId
// 			}).returning('*');

// 			await sp('client_history').update({
// 				status: "COMPLETE",
// 				report: 'Client History successfully updated'
// 			}).where({client_history_id: history.client_history_id});

// 			if (client) {
// 				return res.status(200).json({message: "Client created successfully", client})
// 			}
// 		})
// 	    } catch (error) {
// 		await trx.transaction(async(sp) => {
// 			await sp('client_history').update({
// 				status: "FAILED",
// 				report: 'Client History failed to update'
// 			}).where({client_history_id: history.client_history_id})
// 		});
// 		res.status(400).json({error: error instanceof Error? error.message: error})
// 	    }
// 	})	
//   } catch (error) {
//   	res.status(500).json({error: error instanceof Error? error.message: error})
//   }
// }

const editClient = async (req: any, res: any) => {
  try {
    const { clientId, username, email, phone, address } = req.body;
    const file = req.file;

    console.log("BODY:", req.body);
    console.log("FILE:", file);

    if (!clientId || !username || !email) {
      return res.status(400).json({
        error: "Incomplete entries",
      });
    }

    if (!file) {
      return res.status(400).json({
        error: "Avatar file is required",
      });
    }

    const history = await db("client_history")
      .where({
        client_id: clientId,
      })
      .first();

    if (!history) {
      return res.status(404).json({
        error: "Client history not found",
      });
    }

    // Upload Buffer to Cloudinary
    const avatarResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "avatars",
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      uploadStream.end(file.buffer);
    });

    console.log("Cloudinary URL:", avatarResult.secure_url);

    const client = await db.transaction(async (trx) => {
      const [updatedClient] = await trx("client")
        .update({
          name: username,
          email,
          phone,
          address,
          avatar_url: avatarResult.secure_url,
        })
        .where({
          client_id: clientId,
        })
        .returning("*");

      if (!updatedClient) {
        throw new Error("Client not found");
      }

      await trx("client_history")
        .update({
          status: "COMPLETE",
          report: "Client successfully updated",
        })
        .where({
          client_history_id: history.client_history_id,
        });

      return updatedClient;
    });

    return res.status(200).json({
      message: "Client successfully updated",
      client,
    });

  } catch (error) {
    console.error("editClient error:", error);

    try {
      const { clientId } = req.body;

      const history = await db("client_history")
        .where({
          client_id: clientId,
        })
        .first();

      if (history) {
        await db("client_history")
          .where({
            client_history_id: history.client_history_id,
          })
          .update({
            status: "FAILED",
            report: "Client update failed",
          });
      }
    } catch (historyError) {
      console.error("Failed to update history:", historyError);
    }

    return res.status(500).json({
      error: error instanceof Error
        ? error.message
        : String(error),
    });
  }
};

const fetchClients = async(req: any, res: any) => {
	try {
		const id = req.params.id;
		console.log("id", id)
		if (!id) {
			return res.status(401).json({error: 'Unauthorized'})
		}
		const clients = await db('client').whereNot( 'client_id', String(id) ).select('*');

		// console.log("clients", clients)

		if (!clients) {
			return res.status(400).json({error: "Error generating null users"})
		}
		return res.status(200).json({clients})

	} catch (error) {
		res.status(500).json({error: error instanceof Error? error.message : error})	
	}
}

const fetchUser = async(req: any, res: any) => {
	try {
		const id = req.params.id;
	    const tokenID = req.user?.id
		console.table({id, tokenID})

	    if (id !== tokenID) {
	      return res.status(403).json({error: "Wrong ids!"})
	    }

	    if (id == tokenID) {
          return res.status(200).json({message: "IDs correct and message received"})
	    }
		 console.log("UserID", id)
		res.status(200).json({message: "IDs correct and message received"})
	   
	} catch (error) {
		res.status(500).json({error: 'Server Error'})
	}	
}


export { fetchUser, fetchClients, editClient, getLoginUser, getLogoutUser }