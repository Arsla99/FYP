import { NextApiRequest, NextApiResponse } from "next";
import connectDB from "../../../utils/db";
import User from "../../../models/User";
import { requireAuth } from "../../../utils/serverAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectDB();

  // Authenticate user using unified auth helper
  const user = await requireAuth(req, res);
  if (!user) {
    return; // requireAuth already sent 401 response
  }

  const { method } = req;

  switch (method) {
    case "GET":
      try {
        const userDoc = await (User as any).findById(user.id).select("contacts");
        if (!userDoc) {
          return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ contacts: userDoc.contacts || [] });
      } catch (error) {
        console.error("Error fetching contacts:", error);
        res.status(500).json({ message: "Error fetching contacts" });
      }
      break;

    case "POST":
      try {
        const { name, phone, relationship } = req.body;
        
        if (!name || !phone) {
          return res.status(400).json({ message: "Name and phone are required" });
        }

        const userDoc = await (User as any).findById(user.id);
        if (!userDoc) {
          return res.status(404).json({ message: "User not found" });
        }

        const newContact = {
          name: name.trim(),
          phone: phone.trim(),
          relationship: relationship?.trim() || "Emergency Contact"
        };

        userDoc.contacts.push(newContact);
        await userDoc.save();

        res.status(201).json({ 
          message: "Contact added successfully", 
          contacts: userDoc.contacts 
        });
      } catch (error) {
        console.error("Error adding contact:", error);
        res.status(500).json({ message: "Error adding contact" });
      }
      break;

    case "PUT":
      try {
        const { contactId, name, phone, relationship } = req.body;
        
        if (!contactId || !name || !phone) {
          return res.status(400).json({ message: "Contact ID, name, and phone are required" });
        }

        const userDoc = await (User as any).findById(user.id);
        if (!userDoc) {
          return res.status(404).json({ message: "User not found" });
        }

        const contactIndex = userDoc.contacts.findIndex(
          (contact: any) => contact._id.toString() === contactId
        );

        if (contactIndex === -1) {
          return res.status(404).json({ message: "Contact not found" });
        }

        userDoc.contacts[contactIndex] = {
          ...userDoc.contacts[contactIndex],
          name: name.trim(),
          phone: phone.trim(),
          relationship: relationship?.trim() || "Emergency Contact"
        };

        await userDoc.save();

        res.status(200).json({ 
          message: "Contact updated successfully", 
          contacts: userDoc.contacts 
        });
      } catch (error) {
        console.error("Error updating contact:", error);
        res.status(500).json({ message: "Error updating contact" });
      }
      break;

    case "DELETE":
      try {
        const { contactId } = req.body;
        
        if (!contactId) {
          return res.status(400).json({ message: "Contact ID is required" });
        }

        const userDoc = await (User as any).findById(user.id);
        if (!userDoc) {
          return res.status(404).json({ message: "User not found" });
        }

        const contactIndex = userDoc.contacts.findIndex(
          (contact: any) => contact._id.toString() === contactId
        );

        if (contactIndex === -1) {
          return res.status(404).json({ message: "Contact not found" });
        }

        userDoc.contacts.splice(contactIndex, 1);
        await userDoc.save();

        res.status(200).json({ 
          message: "Contact deleted successfully", 
          contacts: userDoc.contacts 
        });
      } catch (error) {
        console.error("Error deleting contact:", error);
        res.status(500).json({ message: "Error deleting contact" });
      }
      break;

    default:
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
