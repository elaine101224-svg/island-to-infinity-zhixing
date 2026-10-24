import { MemberError, requireMember, allowedMemberEmail, type MemberAccount } from './auth';

export function rosterEditors() {
  return (process.env.MEMBER_ROSTER_EDITORS ?? '').split(',').map(email => email.trim().toLowerCase()).filter(allowedMemberEmail);
}
export function canEditRoster(account: Pick<MemberAccount, 'email' | 'state'>) {
  return account.state === 'active' && rosterEditors().includes(account.email);
}
export async function requireRosterEditor() {
  const member = await requireMember();
  if (!canEditRoster(member.account)) throw new MemberError('Only the designated roster editors can change the member list.', 403);
  return member;
}
