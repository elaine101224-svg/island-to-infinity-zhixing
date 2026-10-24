import type {HomepageContent} from '@/lib/contentSchema';
import type {Term} from './schema';
// Only scheduling fields enter an explicitly reviewed public snapshot.
export function withReviewedCalendar(content:HomepageContent,events:Term['events']):HomepageContent {
 return {...content,cards:content.cards.map(card=>{if(card.kind!=='event'||!card.calendarEventId)return card;const event=events.find(event=>event.id===card.calendarEventId);if(!event)throw Error('Linked calendar event no longer exists');return {...card,date:event.date,startTime:event.startTime??'',endTime:event.endTime??'',planningStatus:event.status,schoolEvent:event.schoolEvent,participationStatus:event.participation};})};
}

export function calendarSnapshotMatches(content:HomepageContent,reviewed:HomepageContent){const keys=['date','startTime','endTime','planningStatus','schoolEvent','participationStatus'] as const;return content.cards.every((card,index)=>card.kind!=='event'||!card.published||!card.calendarEventId||keys.every(key=>card[key]===reviewed.cards[index][key]));}
