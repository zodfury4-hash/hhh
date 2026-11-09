<?php
/**
 * HEA Link — Redirection Engine & Analytics Logger
 * Exact Glassmorphism Theme (Matches Main.dc.html)
 */

require_once __DIR__ . '/inc/db.php';
require_once __DIR__ . '/inc/functions.php';

$code = trim($_GET['c'] ?? '');

if ($code === '') {
    header('Location: index.php');
    exit;
}

try {
    // 1. Lookup link in SQLite
    $stmt = db()->prepare("
        SELECT id, long_url, expires_at, status 
        FROM links 
        WHERE code = ? AND status = 'active'
    ");
    $stmt->execute([$code]);
    $link = $stmt->fetch();

    // 2. Validate Link & Expiration
    $isExpired = false;
    if ($link && !empty($link['expires_at'])) {
        $isExpired = (strtotime($link['expires_at']) < time());
    }

    if (!$link || $isExpired) {
        http_response_code(404);
        ?>
        <!doctype html>
        <html lang="en">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>404 — Link Not Found | HEA Link</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,500;0,600;0,700;1,700&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="style.css">
        </head>
        <body>
            <div class="r" style="min-height: 100vh; display: flex; align-items: center; justify-content: center;">
                <div class="o" style="width:520px;height:520px;background:#2563eb;left:-120px;top:-100px"></div>
                <div class="o" style="width:460px;height:460px;background:#7c3aed;left:30%;bottom:-160px"></div>

                <div class="z" style="max-width: 500px; width: 100%; padding: 20px;">
                    <div class="g c" style="text-align: center; padding: 48px 30px;">
                        <div style="font-size: 50px; margin-bottom: 12px;">🔗</div>
                        <h2 style="margin-bottom: 12px;">Link Not Found</h2>
                        <p class="m" style="font-size: 14px; margin-bottom: 26px; line-height: 1.6;">
                            The link you visited does not exist, has been removed, or has reached its expiration date.
                        </p>
                        <a href="index.php" class="b">Back to Homepage</a>
                    </div>
                </div>
            </div>
        </body>
        </html>
        <?php
        exit;
    }

    // 3. Log Analytics (Device, Referrer, Country)
    $device = get_device_type();
    $referrer = !empty($_SERVER['HTTP_REFERER']) ? substr($_SERVER['HTTP_REFERER'], 0, 500) : null;
    $country = get_visitor_country();

    $logStmt = db()->prepare("
        INSERT INTO clicks (link_id, device, referrer, country)
        VALUES (?, ?, ?, ?)
    ");
    $logStmt->execute([$link['id'], $device, $referrer, $country]);

    $countStmt = db()->prepare("UPDATE links SET clicks = clicks + 1 WHERE id = ?");
    $countStmt->execute([$link['id']]);

    // 4. Perform 302 Found redirect
    header('Location: ' . $link['long_url'], true, 302);
    exit;

} catch (Exception $e) {
    http_response_code(500);
    exit('A database error occurred.');
}
