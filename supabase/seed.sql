-- Run this after:
-- 1. supabase/schema.sql has succeeded
-- 2. Auth users are created:
--    admin@teamsyndicate.com
--    member@teamsyndicat.com
--
-- This creates profiles for the 17 members from the provided sheet.

with member_rows (
  member_code,
  name,
  opening_balance,
  designation,
  phone,
  email,
  nid,
  blood_group,
  address,
  emergency_contact_phone,
  emergency_contact_name
) as (
  values
    ('1', 'Amena Yasmin Mita', 7000, 'Founding Member', '01410777691', 'mita.ameena@gmail.com', '9576075981', 'B Positive', '', '01683136409', 'Tamal'),
    ('2', 'Mahbubur Rahman Ripon', 7000, 'Founding Member', '01791251422', 'mdripon4266@gmail.com', '1954442396', 'O Positive', '', '01935517010', 'Father: Abdul Mannan'),
    ('3', 'Md. Jamiur Rahman Bappy', 27000, 'Founding Member', '01674004867', 'jamiurbappy@gmail.com', '5051596962', 'AB Positive', '', '01689200080', 'Tuhin'),
    ('4', 'Belal Hosen', 7000, 'Founding Member', '01911688349', 'belalhosen.49@gmail.com', '4711773451843', 'O Positive', '', '01913016584', 'Nasima Begum'),
    ('5', 'Awal Labib', 7000, 'Founding Member', '01788213699', 'captawal07@gmail.com', '3775932514', 'B Positive', '', '01768761074', 'Sabrina'),
    ('6', 'Mohammed Azim', 5000, 'Founding Member', '01732031929', 'azimckb@gmail.com', '3303372340', 'O Positive', '', '01797407586', 'Farjana Faija'),
    ('7', 'Rifat Ahmed', 7000, 'Co-Treasurer (CTR)', '01689200080', 'Rifat.consultant@gmail.com', '4185877497', 'O Positive', '', '01716615875', 'Saiful Amin (Father)'),
    ('8', 'Sayed khan', 7000, 'Founding Member', '01857514073', 'sayed8211@gmail.com', '6013990624', 'O Positive', '', '01870387222', 'Father'),
    ('9', 'Md Anas', 0, 'Coordinator (CO)', '01999800805', 'mohammadanas94official@gmail.com', '4635097654', 'O Positive', '', '01913045663', 'Khodeza Begum'),
    ('10', 'Nur Alam', 5000, 'Founding Member', '01948545879', 'nurstmartin34@gmail.com', '1963391881', null, '', '01999800805', 'Md Anas'),
    ('11', 'Saiful Alam Shakil', 7000, 'Founding Member', '01309700071', 'sashakil013097@gmail.com', '7363312708', 'O Positive', '', '01309700071', 'Shakil'),
    ('12', 'Abdullah al Mahin', 0, 'Treasurer (TR)', '01716777770', 'cyanidemohon@gmail.com', '2368900854', 'A Positive', '', '01711474474', 'Abdullah al morshed'),
    ('13', 'Muhammad Sadik', 7000, 'Founding Member', '01885389854', 'muhammadsadik6511@gmail.com', '3314517750', 'A Positive', '', '01878663154', 'Naima'),
    ('14', 'Md Sazzad Hossain', 5000, 'Founding Member', '01736625982', 'saxxados@gmail.com', '6445148346', 'B Positive', '', '01948545879', 'Nur Alam'),
    ('15', 'Md.Ashraful Islam', 7000, 'Founding Member', '01683100440', 'ashrafulite@gmail.com', '19947612251000165', 'AB Positive', '', '01608328287', 'Monia akter'),
    ('16', 'Md Ahasan Habib', 0, 'Founding Member', '01812601315', 'habibahasan50@gmail.com', '3298625629', 'O Positive', '', '01647879346', 'Ishrat Jahan'),
    ('17', 'Sakhawat Hassan Tanvir', 0, 'Founding Member', '01748664422', 'tanvir9822@gmail.com', '1494941220', 'AB Positive', 'Amin Bagh, West Bogura, Kazi para, Barisal', '01756299210', 'Habiba Rahman Santa')
)
insert into public.members (
  member_code,
  name,
  opening_balance,
  designation,
  phone,
  email,
  nid,
  blood_group,
  address,
  emergency_contact_phone,
  emergency_contact_name,
  join_date,
  status
)
select
  member_code,
  name,
  opening_balance::numeric(14, 2),
  designation,
  phone,
  lower(email),
  nid,
  blood_group,
  address,
  emergency_contact_phone,
  emergency_contact_name,
  '2026-05-01'::date,
  'active'
from member_rows
on conflict (email) do update
set
  member_code = excluded.member_code,
  name = excluded.name,
  opening_balance = excluded.opening_balance,
  designation = excluded.designation,
  phone = excluded.phone,
  nid = excluded.nid,
  blood_group = excluded.blood_group,
  address = excluded.address,
  emergency_contact_phone = excluded.emergency_contact_phone,
  emergency_contact_name = excluded.emergency_contact_name,
  join_date = excluded.join_date,
  status = excluded.status;

with arif_member as (
  select id
  from public.members
  where member_code = '52614'
    or lower(email) = 'arif.ahmedex@gmail.com'
),
deleted_arif_transactions as (
  delete from public.transactions t
  using public.contributions c, arif_member am
  where t.contribution_id = c.id
    and c.member_id = am.id
  returning t.id
),
deleted_arif_contributions as (
  delete from public.contributions c
  using arif_member am
  where c.member_id = am.id
  returning c.id
)
delete from public.members m
using arif_member am
where m.id = am.id;

insert into public.users (auth_id, name, email, role)
values (
  (select id from auth.users where email = 'admin@teamsyndicate.com' limit 1),
  'Team Syndicate Admin',
  'admin@teamsyndicate.com',
  'admin'
)
on conflict (email) do update
set
  auth_id = excluded.auth_id,
  name = excluded.name,
  role = excluded.role;

insert into public.users (auth_id, name, email, role, member_id)
select
  au.id,
  m.name,
  lower(m.email),
  'member',
  m.id
from public.members m
join auth.users au on lower(au.email) = lower(m.email)
where m.member_code in (
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
  '11', '12', '13', '14', '15', '16', '17'
)
on conflict (email) do update
set
  auth_id = excluded.auth_id,
  name = excluded.name,
  role = excluded.role,
  member_id = excluded.member_id;

insert into public.users (auth_id, name, email, role, member_id)
values (
  (select id from auth.users where email = 'member@teamsyndicat.com' limit 1),
  'Md Sazzad Hossain',
  'member@teamsyndicat.com',
  'member',
  (select id from public.members where email = 'saxxados@gmail.com' limit 1)
)
on conflict (email) do update
set
  auth_id = excluded.auth_id,
  name = excluded.name,
  role = excluded.role,
  member_id = excluded.member_id;

with target_members as (
  select id
  from public.members
  where member_code in (
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
    '11', '12', '13', '14', '15', '16', '17',
    '52601', '52602', '52603', '52604', '52605', '52606', '52607', '52608',
    '52609', '52610', '52611', '52612', '52613', '52615', '52616', '52617',
    '52618'
  )
),
deleted_transactions as (
  delete from public.transactions t
  using public.contributions c, target_members tm
  where t.contribution_id = c.id
    and c.member_id = tm.id
  returning t.id
)
delete from public.contributions c
using target_members tm
where c.member_id = tm.id;

with admin_user as (
  select id from public.users where email = 'admin@teamsyndicate.com' limit 1
),
members_with_balance as (
  select
    id,
    name,
    opening_balance,
    row_number() over (order by member_code) as row_number
  from public.members
  where member_code in (
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
    '11', '12', '13', '14', '15', '16', '17'
  )
),
contribution_rows as (
  select
    id as member_id,
    5 as month,
    2026 as year,
    5000::numeric(14, 2) as amount,
    least(opening_balance, 5000)::numeric(14, 2) as paid_amount,
    case
      when opening_balance >= 5000 then 'paid'
      when opening_balance > 0 then 'partial'
      else 'unpaid'
    end as status,
    case when opening_balance > 0 then ('2026-05-' || lpad((3 + ((row_number - 1) % 8))::text, 2, '0'))::date end as paid_date,
    case when opening_balance > 0 then 'Cash' end as payment_method,
    'First month contribution' as note,
    (select id from admin_user) as created_by
  from members_with_balance
  union all
  select
    id as member_id,
    6 as month,
    2026 as year,
    2000::numeric(14, 2) as amount,
    least(greatest(opening_balance - 5000, 0), 2000)::numeric(14, 2) as paid_amount,
    case
      when opening_balance >= 7000 then 'paid'
      when opening_balance > 5000 then 'partial'
      else 'unpaid'
    end as status,
    case when opening_balance > 5000 then ('2026-06-' || lpad((4 + ((row_number - 1) % 10))::text, 2, '0'))::date end as paid_date,
    case when opening_balance > 5000 then 'bKash' end as payment_method,
    'Monthly contribution' as note,
    (select id from admin_user) as created_by
  from members_with_balance
  union all
  select
    id as member_id,
    7 as month,
    2026 as year,
    (opening_balance - 7000)::numeric(14, 2) as amount,
    (opening_balance - 7000)::numeric(14, 2) as paid_amount,
    'paid' as status,
    '2026-07-01'::date as paid_date,
    'Bank' as payment_method,
    'Advance balance adjustment' as note,
    (select id from admin_user) as created_by
  from members_with_balance
  where opening_balance > 7000
)
insert into public.contributions (
  member_id,
  month,
  year,
  amount,
  paid_amount,
  status,
  paid_date,
  payment_method,
  note,
  created_by
)
select
  member_id,
  month,
  year,
  amount,
  paid_amount,
  status,
  paid_date,
  payment_method,
  note,
  created_by
from contribution_rows;

insert into public.transactions (
  type,
  amount,
  date,
  member_id,
  contribution_id,
  payment_method,
  note,
  created_by,
  source
)
select
  'Member Contribution',
  c.paid_amount,
  c.paid_date,
  c.member_id,
  c.id,
  c.payment_method,
  c.note,
  c.created_by,
  'auto'
from public.contributions c
where c.paid_amount > 0
  and c.paid_date is not null
  and not exists (
    select 1
    from public.transactions t
    where t.contribution_id = c.id
  );
