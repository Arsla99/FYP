import React from 'react';

interface Contact {
  name: string;
  phone: string;
}

interface ContactListProps {
  contacts: Contact[];
}

const ContactList: React.FC<ContactListProps> = ({ contacts }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-2">Emergency Contacts</h2>
      <ul className="space-y-2">
        {contacts.map((contact, index) => (
          <li key={index} className="flex justify-between items-center p-2 border-b">
            <span className="font-medium">{contact.name}</span>
            <span className="text-gray-600">{contact.phone}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ContactList;