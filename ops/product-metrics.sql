WITH event_metrics AS (
  SELECT
    COUNT(DISTINCT CASE WHEN name = 'visited' THEN session_hash END) AS users,
    COUNT(DISTINCT CASE WHEN name = 'created' THEN session_hash END) AS creators,
    COUNT(DISTINCT CASE WHEN name = 'edited' THEN session_hash END) AS editors,
    COUNT(DISTINCT CASE WHEN name = 'shared' THEN session_hash END) AS sharers,
    COUNT(DISTINCT CASE WHEN name = 'profile_viewed' THEN session_hash END) AS viewers,
    COUNT(DISTINCT CASE WHEN name = 'link_opened' THEN session_hash END) AS outbound_users,
    COUNT(DISTINCT CASE WHEN name = 'mark_copied' THEN session_hash END) AS mark_users,
    COUNT(DISTINCT CASE WHEN name = 'exported' THEN session_hash END) AS exporters,
    COUNT(DISTINCT CASE WHEN name = 'viewer_created' THEN session_hash END) AS referred_creators,
    COUNT(DISTINCT CASE WHEN name = 'returned' THEN session_hash END) AS returned,
    COUNT(DISTINCT CASE WHEN name = 'visited' AND occurred_on >= date('now', '-6 days') THEN session_hash END) AS users_7d,
    COUNT(DISTINCT CASE WHEN name = 'created' AND occurred_on >= date('now', '-6 days') THEN session_hash END) AS creators_7d
  FROM product_events
),
profile_metrics AS (
  SELECT
    COUNT(*) AS active_profiles,
    COUNT(CASE WHEN revision > 1 THEN 1 END) AS edited_profiles,
    COUNT(CASE WHEN json_extract(content_json, '$.discoverable') = 1 THEN 1 END) AS discoverable_profiles,
    COUNT(CASE WHEN json_array_length(json_extract(content_json, '$.sections')) > 0 THEN 1 END) AS profiles_with_sections,
    COUNT(CASE WHEN json_array_length(json_extract(content_json, '$.links')) > 0 THEN 1 END) AS profiles_with_links
  FROM profiles
  WHERE expires_at >= unixepoch()
)
SELECT *
FROM event_metrics
CROSS JOIN profile_metrics;
