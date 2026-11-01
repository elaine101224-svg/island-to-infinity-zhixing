import { MemberError, requireMember, allowedMemberEmail, type MemberAccount } from './auth';

export function rosterEditorsConfigured() { return process.env.MEMBER_ROSTER_EDITORS !== undefined; }
export function rosterEditors() {
  return (process.env.MEMBER_ROSTER_EDITORS ?? '').split(',').map(email => email.trim().toLowerCase()).filter(allowedMemberEmail);
}
export function canEditRoster(account: Pick<MemberAccount, 'email' | 'state' | 'login_method'> & {role?:MemberAccount['role']}) {
  return account.login_method !== 'email-only' && account.state === 'active' && (account.role==='admin'||rosterEditors().includes(account.email));
}
export async function requireRosterEditor() {
  const member = await requireMember();
  if (!canEditRoster(member.account)) throw new MemberError('Administrator or designated roster editor access required.', 403);
  return member;
}
