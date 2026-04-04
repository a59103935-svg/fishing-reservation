-- 장비류
UPDATE products SET category = 'gear' WHERE name IN (
  'Sea Fishing Rod',
  'Long-cast Rod',
  'Electric Reel',
  'Spinning Reel',
  'Boat Fishing Rod'
);

-- 채비류
UPDATE products SET category = 'rig' WHERE name IN (
  'Hairtail Rig Set',
  'Flounder Rig Set'
);

-- 미끼류
UPDATE products SET category = 'bait' WHERE name IN (
  'Earthworm',
  'Sandworm',
  'Krill Shrimp',
  'Red Seabream'
);
