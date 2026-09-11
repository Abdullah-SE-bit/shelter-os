export const mockConversations = [
  {
    id: 'conv-1', other_user_name: 'Jordan Blake', other_user_role: 'SHELTER_ADMIN', unread_count: 2,
    last_message: 'Sounds good — see you at the shelter Saturday morning.', last_message_at: '2026-09-10T16:00:00Z',
  },
  {
    id: 'conv-2', other_user_name: 'Faisal Khan', other_user_role: 'VET', unread_count: 0,
    last_message: "Oliver's follow-up is confirmed for the 20th.", last_message_at: '2026-09-08T12:00:00Z',
  },
  {
    id: 'conv-3', other_user_name: 'Priya Singh', other_user_role: 'VOLUNTEER', unread_count: 1,
    last_message: 'I can pick up the kittens tomorrow morning if that works!', last_message_at: '2026-09-07T09:30:00Z',
  },
];

export const mockMessages = {
  'conv-1': [
    { id: 'm1', sender_name: 'Jordan Blake', is_mine: false, text: 'Hey! Are you free to help with intake this Saturday?', sent_at: '2026-09-10T15:40:00Z' },
    { id: 'm2', sender_name: 'You', is_mine: true, text: 'Yes, I can be there by 9am.', sent_at: '2026-09-10T15:50:00Z' },
    { id: 'm3', sender_name: 'Jordan Blake', is_mine: false, text: 'Sounds good — see you at the shelter Saturday morning.', sent_at: '2026-09-10T16:00:00Z' },
  ],
};
