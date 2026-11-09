<?php
/**
 * HEA Link — Admin Dashboard
 * Matches 1:1 with Main.dc.html Glassmorphism Theme
 */

require_once __DIR__ . '/../inc/auth.php';

require_admin_auth();

$notice = '';
$noticeType = 'success';

// Handle Link Deletion (POST + CSRF)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'delete') {
    $linkId = (int)($_POST['link_id'] ?? 0);
    $csrfToken = $_POST['csrf_token'] ?? '';

    if (!verify_csrf_token($csrfToken)) {
        $notice = 'Security verification failed. Please try again.';
        $noticeType = 'error';
    } else {
        $delStmt = db()->prepare("DELETE FROM links WHERE id = ?");
        $delStmt->execute([$linkId]);
        $notice = 'Link successfully deleted.';
    }
}

// Handle Direct Creation from Admin
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'create') {
    $csrfToken = $_POST['csrf_token'] ?? '';
    $url = $_POST['url'] ?? '';
    $custom = $_POST['custom'] ?? null;
    $title = $_POST['title'] ?? null;

    if (!verify_csrf_token($csrfToken)) {
        $notice = 'Security verification failed.';
        $noticeType = 'error';
    } else {
        try {
            $created = create_link($url, $custom, $title);
            $notice = "Link created! Short code: <b>" . h($created['code']) . "</b>";
        } catch (Exception $e) {
            $notice = $e->getMessage();
            $noticeType = 'error';
        }
    }
}

// Search Filter
$search = trim($_GET['q'] ?? '');

// Fetch Summary Metrics
$totalLinks = (int)db()->query("SELECT COUNT(*) FROM links")->fetchColumn();
$totalClicks = (int)db()->query("SELECT COALESCE(SUM(clicks), 0) FROM links")->fetchColumn();

// Device Metrics
$devicesStmt = db()->query("
    SELECT device, COUNT(*) as cnt 
    FROM clicks 
    GROUP BY device
");
$deviceStats = ['desktop' => 0, 'mobile' => 0, 'tablet' => 0];
while ($row = $devicesStmt->fetch()) {
    $d = strtolower($row['device'] ?? 'desktop');
    $deviceStats[$d] = (int)$row['cnt'];
}

// Fetch Links List (with Search)
if ($search !== '') {
    $listStmt = db()->prepare("
        SELECT * FROM links 
        WHERE code LIKE ? OR long_url LIKE ? OR title LIKE ?
        ORDER BY id DESC
    ");
    $term = "%{$search}%";
    $listStmt->execute([$term, $term, $term]);
} else {
    $listStmt = db()->query("SELECT * FROM links ORDER BY id DESC LIMIT 100");
}
$links = $listStmt->fetchAll();
$baseUrl = get_base_url();
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard — HEA Link</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,500;0,600;0,700;1,700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../style.css">
</head>
<body>
    <div class="r" style="min-height: 1200px; padding-bottom: 80px;">
        <!-- Exact Ambient Glowing Orbs -->
        <div class="o" style="width:520px;height:520px;background:#2563eb;left:-120px;top:-100px"></div>
        <div class="o" style="width:460px;height:460px;background:#14b8a6;right:-100px;top:180px"></div>
        <div class="o" style="width:480px;height:480px;background:#7c3aed;left:30%;bottom:-160px"></div>

        <div class="z">
            <!-- Exact Pill Navbar for Admin -->
            <div class="w f" style="align-items:center;justify-content:space-between;padding-top:20px">
                <div class="g f" style="width:100%;align-items:center;justify-content:space-between;padding:12px 22px;border-radius:99px;box-sizing:border-box">
                    <a href="../index.php" class="f" style="align-items:center;gap:10px">
                        <span style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#38bdf8,#2563eb);box-shadow:0 0 20px rgba(56,189,248,.6);display:inline-block"></span>
                        <span style="font-size:20px"><b style="font-style:italic">HEA</b> <span class="k">Link</span> <span class="m" style="font-size:12px;font-weight:normal">| Dashboard</span></span>
                    </a>

                    <div class="f" style="gap:14px;align-items:center">
                        <span class="m" style="font-size:13px">Signed in: <b style="color:#fff"><?= h($_SESSION['admin_username']) ?></b></span>
                        <a href="../index.php" class="n" target="_blank" style="padding:8px 14px;font-size:12px">View Website ↗</a>
                        <a href="logout.php" class="n" style="padding:8px 14px;font-size:12px;color:#fca5a5;border-color:rgba(239,68,68,0.4)">Log out</a>
                    </div>
                </div>
            </div>

            <!-- Page Container -->
            <div class="w" style="padding-top: 40px;">
                <?php if (!empty($notice)): ?>
                    <div class="g" style="padding: 14px 20px; border-radius: 14px; margin-bottom: 24px; font-size: 14px; <?= $noticeType === 'error' ? 'background:rgba(239,68,68,0.2);color:#fca5a5;' : 'background:rgba(20,184,166,0.2);color:#5eead4;' ?>">
                        <?= $notice ?>
                    </div>
                <?php endif; ?>

                <!-- Metrics 4-Grid matching Exact Feature Grid -->
                <div class="gr" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 30px;">
                    <div class="g c">
                        <span class="k" style="font-size: 11px; font-weight: 600; letter-spacing: 0.1em;">TOTAL LINKS</span>
                        <h2 style="text-align: left; font-size: 34px; margin: 8px 0;"><?= number_format($totalLinks) ?></h2>
                        <p class="m" style="font-size: 12px;">Active shortened destinations</p>
                    </div>

                    <div class="g c">
                        <span class="k" style="font-size: 11px; font-weight: 600; letter-spacing: 0.1em;">TOTAL CLICKS</span>
                        <h2 style="text-align: left; font-size: 34px; margin: 8px 0; color: #7cb2ff;"><?= number_format($totalClicks) ?></h2>
                        <p class="m" style="font-size: 12px;">302 direct visits tracked</p>
                    </div>

                    <div class="g c">
                        <span class="k" style="font-size: 11px; font-weight: 600; letter-spacing: 0.1em;">MOBILE CLICKS</span>
                        <h2 style="text-align: left; font-size: 34px; margin: 8px 0;"><?= number_format($deviceStats['mobile']) ?></h2>
                        <p class="m" style="font-size: 12px;">Smartphones &amp; Tablets</p>
                    </div>

                    <div class="g c">
                        <span class="k" style="font-size: 11px; font-weight: 600; letter-spacing: 0.1em;">DESKTOP CLICKS</span>
                        <h2 style="text-align: left; font-size: 34px; margin: 8px 0;"><?= number_format($deviceStats['desktop']) ?></h2>
                        <p class="m" style="font-size: 12px;">Laptops &amp; PCs</p>
                    </div>
                </div>

                <!-- Admin Link Creator -->
                <div class="g c" style="margin-bottom: 30px;">
                    <h3 style="font-size: 16px; margin-bottom: 14px;">Create Short Link from Admin</h3>
                    <form method="POST" action="dashboard.php" class="f" style="gap: 12px; flex-wrap: wrap;">
                        <input type="hidden" name="action" value="create">
                        <input type="hidden" name="csrf_token" value="<?= h(get_csrf_token()) ?>">

                        <input type="url" name="url" class="i" placeholder="https://example.com/destination-page" required style="flex: 2; min-width: 240px;">
                        <input type="text" name="custom" class="i" placeholder="Custom back-half (optional)" style="flex: 1; min-width: 180px;">
                        <button type="submit" class="b" style="white-space: nowrap;">Create Link</button>
                    </form>
                </div>

                <!-- Managed Links Table Card -->
                <div class="g c" style="padding: 28px;">
                    <div class="f" style="justify-content: space-between; align-items: center; margin-bottom: 22px; flex-wrap: wrap; gap: 14px;">
                        <div>
                            <h3 style="font-size: 18px; margin-bottom: 4px;">Link Database</h3>
                            <p class="m" style="font-size: 13px;">Showing <?= count($links) ?> active short links in SQLite</p>
                        </div>

                        <form method="GET" action="dashboard.php" class="f" style="gap: 8px;">
                            <input type="text" name="q" value="<?= h($search) ?>" placeholder="Search code or URL..." class="i" style="padding: 8px 12px; width: 220px; font-size: 13px;">
                            <button type="submit" class="n">Search</button>
                        </form>
                    </div>

                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left;">
                            <thead>
                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.15); color: #a9b6d6;">
                                    <th style="padding: 12px 14px;">Short Link</th>
                                    <th style="padding: 12px 14px;">Destination URL</th>
                                    <th style="padding: 12px 14px;">Clicks</th>
                                    <th style="padding: 12px 14px;">Created</th>
                                    <th style="padding: 12px 14px; text-align: right;">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if (empty($links)): ?>
                                    <tr>
                                        <td colspan="5" class="m" style="text-align: center; padding: 40px;">
                                            No links recorded yet.
                                        </td>
                                    </tr>
                                <?php else: ?>
                                    <?php foreach ($links as $row): ?>
                                        <?php $fullShort = $baseUrl . '/' . $row['code']; ?>
                                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                                            <td style="padding: 14px;">
                                                <a href="<?= h($fullShort) ?>" target="_blank" style="color: #60a5fa; font-weight: 600;">
                                                    /<?= h($row['code']) ?>
                                                </a>
                                            </td>
                                            <td style="padding: 14px;">
                                                <a href="<?= h($row['long_url']) ?>" target="_blank" class="m" style="max-width: 320px; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="<?= h($row['long_url']) ?>">
                                                    <?= h($row['long_url']) ?>
                                                </a>
                                            </td>
                                            <td style="padding: 14px;">
                                                <span class="t" style="background: rgba(96,165,250,0.25); color: #93c5fd; font-weight: 600;">
                                                    <?= (int)$row['clicks'] ?> clicks
                                                </span>
                                            </td>
                                            <td class="m" style="padding: 14px; font-size: 12px;">
                                                <?= h(date('M d, Y', strtotime($row['created_at']))) ?>
                                            </td>
                                            <td style="padding: 14px; text-align: right;">
                                                <div class="f" style="justify-content: flex-end; gap: 8px;">
                                                    <button onclick="navigator.clipboard.writeText('<?= h($fullShort) ?>'); alert('Copied: <?= h($fullShort) ?>');" class="n" style="padding: 5px 10px; font-size: 11px;">Copy</button>
                                                    <form method="POST" action="dashboard.php" onsubmit="return confirm('Delete /<?= h($row['code']) ?>?');" style="display: inline;">
                                                        <input type="hidden" name="action" value="delete">
                                                        <input type="hidden" name="link_id" value="<?= (int)$row['id'] ?>">
                                                        <input type="hidden" name="csrf_token" value="<?= h(get_csrf_token()) ?>">
                                                        <button type="submit" class="n" style="padding: 5px 10px; font-size: 11px; color: #fca5a5; border-color: rgba(239,68,68,0.4)">Delete</button>
                                                    </form>
                                                </div>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
