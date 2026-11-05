import { officialContact } from '@/lib/site';

export function OfficialContact({ compact = false }: { compact?: boolean }) {
  return <address className={`official-contact${compact ? ' official-contact-compact' : ''}`}>
    <span>{officialContact.name}</span>
    <a href={`mailto:${officialContact.email}`}>{officialContact.email}</a>
  </address>;
}
