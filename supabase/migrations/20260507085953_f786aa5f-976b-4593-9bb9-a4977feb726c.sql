
insert into storage.buckets (id, name, public)
values ('shop-item-images', 'shop-item-images', true)
on conflict (id) do nothing;

create policy "Shop item images public read"
on storage.objects for select
using (bucket_id = 'shop-item-images');

create policy "Admins upload shop item images"
on storage.objects for insert to authenticated
with check (bucket_id = 'shop-item-images' and public.has_role(auth.uid(), 'admin'));

create policy "Admins update shop item images"
on storage.objects for update to authenticated
using (bucket_id = 'shop-item-images' and public.has_role(auth.uid(), 'admin'));

create policy "Admins delete shop item images"
on storage.objects for delete to authenticated
using (bucket_id = 'shop-item-images' and public.has_role(auth.uid(), 'admin'));
