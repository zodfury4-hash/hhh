<?php
/**
 * HEA Link — Database Connection & Auto Initialization
 * Uses SQLite with PDO (Compatible with Hostinger & Local XAMPP)
 */

function db(): PDO {
    static $pdo = null;

    if ($pdo === null) {
        $dataDir = __DIR__ . '/../../data';
        
        // Ensure data directory exists
        if (!is_dir($dataDir)) {
            mkdir($dataDir, 0755, true);
        }

        $dbPath = $dataDir . '/app.db';
        $isNewDb = !file_exists($dbPath);

        $pdo = new PDO('sqlite:' . $dbPath);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

        // Performance & integrity pragmas for SQLite
        $pdo->exec('PRAGMA foreign_keys = ON;');
        $pdo->exec('PRAGMA journal_mode = WAL;');

        // Auto-create database schema on first run
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS links (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT UNIQUE NOT NULL,
                long_url TEXT NOT NULL,
                title TEXT,
                clicks INTEGER DEFAULT 0,
                status TEXT DEFAULT 'active',
                expires_at TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_links_code ON links(code);

            CREATE TABLE IF NOT EXISTS clicks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                link_id INTEGER NOT NULL,
                clicked_at TEXT DEFAULT CURRENT_TIMESTAMP,
                device TEXT,
                referrer TEXT,
                country TEXT,
                FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_clicks_link ON clicks(link_id);

            CREATE TABLE IF NOT EXISTS admins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS login_attempts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ip_address TEXT NOT NULL,
                attempted_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_attempts_ip ON login_attempts(ip_address);
        ");

        // Seed default admin if table is empty: admin / Admin@123
        $stmt = $pdo->query("SELECT COUNT(*) AS cnt FROM admins");
        if ($stmt->fetch()['cnt'] == 0) {
            $defaultHash = password_hash('Admin@123', PASSWORD_BCRYPT);
            $seed = $pdo->prepare("INSERT INTO admins (username, password_hash) VALUES (?, ?)");
            $seed->execute(['admin', $defaultHash]);
        }
    }

    return $pdo;
}
