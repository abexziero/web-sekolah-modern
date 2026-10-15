CREATE TABLE media (
 id CHAR(36) NOT NULL PRIMARY KEY,
 storage_key CHAR(36) NOT NULL UNIQUE,
 mime VARCHAR(80) NOT NULL,
 size INT UNSIGNED NOT NULL,
 width INT UNSIGNED NULL,
 height INT UNSIGNED NULL,
 alt VARCHAR(250) NOT NULL,
 caption VARCHAR(400) NOT NULL DEFAULT '',
 credit VARCHAR(250) NOT NULL DEFAULT '',
 uploaded_by VARCHAR(255) NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
 FOREIGN KEY (uploaded_by) REFERENCES `user`(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE cms_revision_media (
 revision_id CHAR(36) NOT NULL,
 media_id CHAR(36) NOT NULL,
 PRIMARY KEY(revision_id,media_id),
 FOREIGN KEY(revision_id) REFERENCES cms_revisions(id),
 FOREIGN KEY(media_id) REFERENCES media(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE article_revision_media (
 revision_id CHAR(36) NOT NULL,
 media_id CHAR(36) NOT NULL,
 PRIMARY KEY(revision_id,media_id),
 FOREIGN KEY(revision_id) REFERENCES article_revisions(id),
 FOREIGN KEY(media_id) REFERENCES media(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
