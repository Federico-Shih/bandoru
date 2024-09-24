CREATE TABLE IF NOT EXISTS bandoru(
    id UUID PRIMARY KEY,
    parent_id UUID REFERENCES bandoru(id),
    description VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bandoru_revision(
    id UUID PRIMARY KEY,
    bandoru_id UUID NOT NULL REFERENCES bandoru(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS file(
    id UUID PRIMARY KEY,
    revision_id UUID NOT NULL REFERENCES bandoru_revision(id) ON DELETE CASCADE,
    filename VARCHAR(127) NOT NULL
);

CREATE OR REPLACE VIEW bandoru_current AS
    SELECT b.id, b.parent_id, b.description, b.created_at, max(br.created_at) AS last_modified, count(f.id) file_count, array_agg(f.id) file_ids, array_agg(f.filename) filenames
    FROM bandoru b
    JOIN bandoru_revision br on b.id = br.bandoru_id
    JOIN file f on br.id = f.revision_id
    WHERE br.created_at = (
        SELECT max(br2.created_at)
        FROM bandoru_revision br2
        WHERE br2.bandoru_id = b.id
    )
    GROUP BY b.id;

CREATE INDEX IF NOT EXISTS idx_file_revision_id ON file(revision_id);
CREATE INDEX IF NOT EXISTS idx_revision_bandoru_id ON bandoru_revision(bandoru_id);
CREATE INDEX IF NOT EXISTS idx_revision_created_at ON bandoru_revision(created_at);
