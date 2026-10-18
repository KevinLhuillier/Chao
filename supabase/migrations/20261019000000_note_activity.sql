-- Free lesson cards ("note"): blocks of text and sounds that don't teach a word
-- (alphabet, tones, grammar…). Payload: see NoteBlock in packages/shared.
alter table public.activities drop constraint activities_type_check;
alter table public.activities add constraint activities_type_check check (type in (
  'learn', 'note', 'choice_meaning', 'choice_vi', 'listen_choice', 'type_meaning', 'type_vi',
  'listen_type', 'match', 'build_vi', 'build_meaning'
));
