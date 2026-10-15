CREATE TABLE auth_throttle (
  `key` CHAR(64) NOT NULL PRIMARY KEY,
  attempts INT UNSIGNED NOT NULL,
  window_start DATETIME(3) NOT NULL,
  KEY throttle_expiry (window_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE auth_totp_used (
  code_hash CHAR(64) NOT NULL PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  KEY totp_expiry (expires_at),
  CONSTRAINT used_totp_user FOREIGN KEY (user_id) REFERENCES `user`(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE articles ADD CONSTRAINT article_author FOREIGN KEY (author_id) REFERENCES `user`(id);
ALTER TABLE article_revisions ADD CONSTRAINT revision_author FOREIGN KEY (saved_by) REFERENCES `user`(id);
ALTER TABLE audit_logs ADD CONSTRAINT audit_actor_user FOREIGN KEY (actor_id) REFERENCES `user`(id) ON DELETE SET NULL;
