<?php
/**
 * HEA Link — Admin Authentication & Security
 */

require_once __DIR__ . '/functions.php';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

/**
 * Check if the admin is currently authenticated
 */
function is_admin_logged_in(): bool {
    init_session();
    return !empty($_SESSION['admin_user_id']) && !empty($_SESSION['admin_username']);
}

/**
 * Enforce admin login for protected pages
 */
function require_admin_auth(): void {
    if (!is_admin_logged_in()) {
        header('Location: login.php');
        exit;
    }
}

/**
 * Check if the current client IP has exceeded failed attempts
 */
function is_ip_locked(): bool {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    $thresholdTime = date('Y-m-d H:i:s', strtotime('-' . LOCKOUT_MINUTES . ' minutes'));

    $stmt = db()->prepare("
        SELECT COUNT(*) AS attempts 
        FROM login_attempts 
        WHERE ip_address = ? AND attempted_at > ?
    ");
    $stmt->execute([$ip, $thresholdTime]);
    $count = (int)$stmt->fetch()['attempts'];

    return $count >= MAX_LOGIN_ATTEMPTS;
}

/**
 * Record a failed login attempt for the client IP
 */
function record_failed_attempt(): void {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    $stmt = db()->prepare("INSERT INTO login_attempts (ip_address) VALUES (?)");
    $stmt->execute([$ip]);
}

/**
 * Clear failed attempts after a successful login
 */
function clear_login_attempts(): void {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    $stmt = db()->prepare("DELETE FROM login_attempts WHERE ip_address = ?");
    $stmt->execute([$ip]);
}

/**
 * Attempt admin login
 */
function attempt_admin_login(string $username, string $password): bool {
    if (is_ip_locked()) {
        throw new RuntimeException("Too many failed login attempts. Please wait " . LOCKOUT_MINUTES . " minutes.");
    }

    $stmt = db()->prepare("SELECT id, username, password_hash FROM admins WHERE username = ?");
    $stmt->execute([trim($username)]);
    $admin = $stmt->fetch();

    if ($admin && password_verify($password, $admin['password_hash'])) {
        // Successful login
        clear_login_attempts();
        init_session();
        session_regenerate_id(true);

        $_SESSION['admin_user_id'] = $admin['id'];
        $_SESSION['admin_username'] = $admin['username'];
        return true;
    }

    // Failed login
    record_failed_attempt();
    return false;
}
