create view violence_type_counts as
select t as violence_type, count(*) as total
from reports, unnest(violence_types) as t
group by t;
