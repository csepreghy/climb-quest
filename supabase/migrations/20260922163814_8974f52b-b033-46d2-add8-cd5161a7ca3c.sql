CREATE OR REPLACE FUNCTION public.notify_admins_of_feedback()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  who text;
BEGIN
  SELECT COALESCE(NULLIF(btrim(p.character_name), ''), p.display_name, p.email, 'A climber')
    INTO who
  FROM public.profiles p WHERE p.id = NEW.user_id;

  INSERT INTO public.notifications (user_id, audience, type, source, title, body, priority, payload)
  SELECT ur.user_id, 'user', 'feedback', 'system',
         'New feedback: ' || NEW.category,
         COALESCE(who, 'A climber') || ' wrote: ' || NEW.message,
         'normal',
         jsonb_build_object('feedback_id', NEW.id, 'category', NEW.category)
  FROM public.user_roles ur
  WHERE ur.role = 'admin'::app_role;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_feedback_notify_admins ON public.feedback;
CREATE TRIGGER trg_feedback_notify_admins
AFTER INSERT ON public.feedback
FOR EACH ROW EXECUTE FUNCTION public.notify_admins_of_feedback();