CREATE TABLE IF NOT EXISTS schedule_settings (
  date DATE PRIMARY KEY,
  is_holiday BOOLEAN DEFAULT false
);
