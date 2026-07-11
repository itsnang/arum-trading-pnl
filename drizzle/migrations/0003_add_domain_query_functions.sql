CREATE OR REPLACE FUNCTION get_accounts_with_stats(p_user_id text, p_recent_since date)
RETURNS TABLE (
  id text,
  user_id text,
  name text,
  broker text,
  type account_type,
  starting_balance numeric,
  created_at timestamp,
  updated_at timestamp,
  total_pnl numeric,
  trade_count bigint,
  recent_count bigint
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    ta.id,
    ta.user_id,
    ta.name,
    ta.broker,
    ta.type,
    ta.starting_balance,
    ta.created_at,
    ta.updated_at,
    COALESCE(SUM(t.pnl), 0) AS total_pnl,
    COUNT(t.id) AS trade_count,
    COUNT(t.id) FILTER (WHERE t.date >= p_recent_since) AS recent_count
  FROM trading_account ta
  LEFT JOIN trade t ON t.account_id = ta.id AND t.user_id = p_user_id
  WHERE ta.user_id = p_user_id
  GROUP BY ta.id
  ORDER BY ta.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION get_month_journal(p_user_id text, p_account_id text, p_first_day date, p_last_day date)
RETURNS TABLE (
  date date,
  total_pnl numeric,
  trade_count bigint,
  win_count bigint,
  loss_count bigint
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    t.date,
    SUM(t.pnl) AS total_pnl,
    COUNT(*) AS trade_count,
    COUNT(*) FILTER (WHERE t.result = 'win') AS win_count,
    COUNT(*) FILTER (WHERE t.result = 'loss') AS loss_count
  FROM trade t
  WHERE t.user_id = p_user_id
    AND t.account_id = p_account_id
    AND t.date >= p_first_day
    AND t.date <= p_last_day
  GROUP BY t.date;
$$;

GRANT EXECUTE ON FUNCTION get_accounts_with_stats(text, date) TO service_role;
GRANT EXECUTE ON FUNCTION get_month_journal(text, text, date, date) TO service_role;
