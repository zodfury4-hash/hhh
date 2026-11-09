<?php
/**
 * HEA Link — JSON API Endpoint for Link Shortening
 */

header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/../inc/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed. Use POST.']);
    exit;
}

// Support both form POST and JSON payload
$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    $input = $_POST;
}

$url = $input['url'] ?? '';
$custom = $input['custom'] ?? null;
$title = $input['title'] ?? null;
$csrfToken = $input['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;

// Validate CSRF token
if (!verify_csrf_token($csrfToken)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Security token invalid or expired. Please refresh the page.']);
    exit;
}

try {
    $result = create_link($url, $custom, $title);
    echo json_encode([
        'success' => true,
        'code' => $result['code'],
        'short_url' => $result['short_url'],
        'long_url' => $result['long_url']
    ]);
} catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
} catch (RuntimeException $e) {
    http_response_code(409); // Conflict (e.g. duplicate custom slug)
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
