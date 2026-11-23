insert into public.departments (name, description) values
('Computer Science', 'Computing, AI and software systems'),
('Electronics', 'Embedded systems and electronics'),
('Mechanical', 'Manufacturing and mechanical systems'),
('Robotics', 'Robotics and automation')
on conflict (name) do nothing;

insert into public.equipment
(name, department_id, description, specifications, location, status, opening_time, closing_time)
select 'GPU Workstation', id, 'High-performance workstation for AI and simulation.',
'{"gpu_memory_gb":24,"cuda":true,"ram_gb":64}'::jsonb, 'CS Lab 2', 'active', '09:00', '17:00'
from public.departments where name='Computer Science'
on conflict do nothing;

insert into public.equipment
(name, department_id, description, specifications, location, status, opening_time, closing_time)
select 'FPGA Development Kit', id, 'FPGA prototyping and digital design kit.',
'{"fpga":true,"board":"Artix-7"}'::jsonb, 'Electronics Lab 1', 'active', '09:00', '16:30'
from public.departments where name='Electronics';

insert into public.equipment
(name, department_id, description, specifications, location, status, opening_time, closing_time)
select 'Robotics Development Kit', id, 'Mobile robotics prototyping platform.',
'{"microcontroller":"ESP32","sensors":true}'::jsonb, 'Robotics Lab', 'active', '10:00', '17:00'
from public.departments where name='Robotics';
