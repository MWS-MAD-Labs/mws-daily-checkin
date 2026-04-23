import React, { memo } from "react";
import { motion } from "framer-motion";
import { User } from "lucide-react";

const SupportContacts = memo(({ contacts, lowPresence }) => (
    <div className="bg-surface/50 rounded-lg p-3 border border-border/30">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
            <User className="w-3 h-3" />
            Support Contacts
        </h4>
        <div className="grid grid-cols-1 gap-1.5">
            {contacts.map((contact, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className={`px-3 py-2 rounded text-xs font-medium transition-all duration-300 ${i === 0
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-surface border border-border hover:border-primary/40 text-foreground'
                        }`}
                >
                    <div className="font-semibold">{contact.name}</div>
                    <div className="text-[10px] opacity-75">
                        {contact.role} {contact.jobLevel && contact.jobLevel !== 'N/A' ? `(${contact.jobLevel})` : ''} {contact.department && contact.department !== 'N/A' ? `- ${contact.department}` : ''}
                    </div>
                </motion.div>
            ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
            {lowPresence
                ? "Low presence detected—reaching out is strongly encouraged"
                : "Consider connecting if you need support"}
        </p>
    </div>
));

SupportContacts.displayName = 'SupportContacts';
export default SupportContacts;