<?php
/**
 * HEA Link — Core Utility & Business Functions
 */

require_once __DIR__ . '/db.php';

const RESERVED = [
    'admin', 'api', 'login', 'logout', 'dashboard', 'index',
    'static', 'assets', 'inc', 'data', 'public_html', 'redirect',
    'favicon.ico', 'robots.txt', 'sitemap.xml', 'terms', 'privacy'
];

/**
 * Validate that a URL is well-formed and uses http or https
 */
function valid_url(string $url): bool {
    if (!filter_var($url, FILTER_VALIDATE_URL)) {
        return false;
    }
    $scheme = parse_url($url, PHP_URL_SCHEME);
    return in_array(strtolower($scheme ?? ''), ['http', 'https'], true);
}

/**
 * Generate a cryptographically secure random alphanumeric code
 */
function make_code(int $len = 6): string {
    $chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $charsLen = strlen($chars);

    do {
        $code = '';
        for ($i = 0; $i < $len; $i++) {
            $code .= $chars[random_int(0, $charsLen - 1)];
        }
        $st = db()->prepare("SELECT 1 FROM links WHERE code = ?");
        $st->execute([$code]);
    } while ($st->fetch());

    return $code;
}

/**
 * Create a new short link in the database
 */
function create_link(string $url, ?string $custom = null, ?string $title = null, ?string $expires_at = null): array {
    $url = trim($url);
    if (!valid_url($url)) {
        throw new InvalidArgumentException('Invalid destination URL. Must begin with http:// or https://');
    }

    $custom = trim($custom ?? '');
    if ($custom !== '') {
        if (!preg_match('/^[A-Za-z0-9_-]{3,32}$/', $custom)) {
            throw new InvalidArgumentException('Custom back-half must be 3-32 characters (letters, numbers, underscores, dashes only).');
        }
        if (in_array(strtolower($custom), RESERVED, true)) {
            throw new InvalidArgumentException("The back-half '{$custom}' is reserved by the system.");
        }
        $code = $custom;
    } else {
        $code = make_code();
    }

    try {
        $stmt = db()->prepare("
            INSERT INTO links (code, long_url, title, expires_at)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([
            $code,
            $url,
            $title ?: null,
            $expires_at ?: null
        ]);

        return [
            'id' => (int)db()->lastInsertId(),
            'code' => $code,
            'long_url' => $url,
            'short_url' => get_base_url() . '/' . $code
        ];
    } catch (PDOException $e) {
        // SQLite unique constraint error code 19 / 23000
        if ($e->getCode() == 23000 || strpos($e->getMessage(), 'UNIQUE') !== false) {
            throw new RuntimeException("The custom back-half '{$code}' is already taken. Please choose another.");
        }
        throw $e;
    }
}

/**
 * Determine dynamic base URL based on host, port and HTTPS status
 */
function get_base_url(): string {
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https')
        || (!empty($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443);

    $protocol = $isHttps ? 'https://' : 'http://';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';

    // Remove script path if accessed directly
    return rtrim($protocol . $host, '/');
}

/**
 * Categorize device from User-Agent
 */
function get_device_type(): string {
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
    if (preg_match('/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i', $ua)) {
        return 'tablet';
    }
    if (preg_match('/Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i', $ua)) {
        return 'mobile';
    }
    return 'desktop';
}

/**
 * Detect country code (from Cloudflare or server header)
 */
function get_visitor_country(): string {
    if (!empty($_SERVER['HTTP_CF_IPCOUNTRY'])) {
        return strtoupper(substr($_SERVER['HTTP_CF_IPCOUNTRY'], 0, 2));
    }
    if (!empty($_SERVER['GEOIP_COUNTRY_CODE'])) {
        return strtoupper(substr($_SERVER['GEOIP_COUNTRY_CODE'], 0, 2));
    }
    return 'PK'; // Default fallback
}

/**
 * CSRF Protection
 */
function init_session(): void {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
}

function get_csrf_token(): string {
    init_session();
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function verify_csrf_token(?string $token): bool {
    init_session();
    if (empty($_SESSION['csrf_token']) || empty($token)) {
        return false;
    }
    return hash_equals($_SESSION['csrf_token'], $token);
}

/**
 * Safe HTML escape helper
 */
function h(?string $value): string {
    return htmlspecialchars($value ?? '', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
