CREATE TABLE public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  period text NOT NULL DEFAULT 'monthly',
  category text NOT NULL DEFAULT 'overall',
  amount_inr numeric NOT NULL CHECK (amount_inr >= 0),
  starts_on date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT budgets_period_check CHECK (period IN ('monthly','yearly'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.budgets TO authenticated;
GRANT ALL ON public.budgets TO service_role;

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own budgets" ON public.budgets
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER budgets_touch BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX budgets_user_period_idx ON public.budgets (user_id, period);