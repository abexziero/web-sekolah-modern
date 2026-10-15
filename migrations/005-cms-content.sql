CREATE TABLE cms_entries (
 id CHAR(36) NOT NULL PRIMARY KEY,
 type VARCHAR(32) NOT NULL,
 entry_key VARCHAR(160) NOT NULL,
 owner_id VARCHAR(255) NOT NULL,
 status ENUM('draft','review','published','archived') NOT NULL DEFAULT 'draft',
 version INT UNSIGNED NOT NULL DEFAULT 0,
 current_revision_id CHAR(36) NULL,
 published_revision_id CHAR(36) NULL,
 published_at DATETIME(3) NULL,
 updated_at DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
 UNIQUE KEY cms_key (type, entry_key),
 FOREIGN KEY (owner_id) REFERENCES `user`(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE cms_revisions (
 id CHAR(36) NOT NULL PRIMARY KEY,
 entry_id CHAR(36) NOT NULL,
 revision_number INT UNSIGNED NOT NULL,
 schema_version INT UNSIGNED NOT NULL DEFAULT 1,
 payload JSON NOT NULL,
 saved_by VARCHAR(255) NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
 UNIQUE KEY cms_revision_owner (entry_id,id),
 UNIQUE KEY cms_revision_number (entry_id,revision_number),
 FOREIGN KEY (entry_id) REFERENCES cms_entries(id),
 FOREIGN KEY (saved_by) REFERENCES `user`(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE cms_entries ADD FOREIGN KEY (id,current_revision_id) REFERENCES cms_revisions(entry_id,id), ADD FOREIGN KEY (id,published_revision_id) REFERENCES cms_revisions(entry_id,id);
CREATE TABLE cms_publication_lock (id INT NOT NULL PRIMARY KEY) ENGINE=InnoDB;
INSERT INTO cms_publication_lock(id) VALUES (1);
