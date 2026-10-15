CREATE TABLE articles (
  id CHAR(36) NOT NULL PRIMARY KEY,
  slug VARCHAR(160) NOT NULL,
  author_id VARCHAR(255) NOT NULL,
  status ENUM('draft', 'review', 'published', 'archived') NOT NULL DEFAULT 'draft',
  version INT UNSIGNED NOT NULL DEFAULT 1,
  current_revision_id CHAR(36) NULL,
  published_revision_id CHAR(36) NULL,
  published_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
  updated_at DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
  UNIQUE KEY articles_slug (slug),
  KEY articles_author (author_id, updated_at),
  KEY articles_publication (status, published_at),
  CONSTRAINT articles_version_positive CHECK (version >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE article_revisions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  article_id CHAR(36) NOT NULL,
  revision_number INT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  excerpt VARCHAR(400) NOT NULL,
  category VARCHAR(60) NOT NULL,
  image VARCHAR(80) NOT NULL,
  image_alt VARCHAR(250) NOT NULL,
  blocks JSON NOT NULL,
  saved_by VARCHAR(255) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
  UNIQUE KEY revision_number (article_id, revision_number),
  UNIQUE KEY revision_owner (article_id, id),
  CONSTRAINT revision_article FOREIGN KEY (article_id) REFERENCES articles(id),
  CONSTRAINT revision_number_positive CHECK (revision_number >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE articles
  ADD CONSTRAINT current_revision_owner FOREIGN KEY (id, current_revision_id) REFERENCES article_revisions(article_id, id),
  ADD CONSTRAINT published_revision_owner FOREIGN KEY (id, published_revision_id) REFERENCES article_revisions(article_id, id);

CREATE TABLE audit_logs (
  id CHAR(36) NOT NULL PRIMARY KEY,
  actor_id VARCHAR(255) NULL,
  action VARCHAR(60) NOT NULL,
  object_id VARCHAR(255) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
  KEY audit_actor (actor_id, created_at),
  KEY audit_object (object_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
