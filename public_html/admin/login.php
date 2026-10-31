<?php
/**
 * HEA Link — Admin Login
 * Matches 1:1 with Main.dc.html Glassmorphism Theme
 */

require_once __DIR__ . '/../inc/auth.php';

init_session();

if (is_admin_logged_in()) {
    header('Location: dashboard.php');
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    $csrfToken = $_POST['csrf_token'] ?? '';

    if (!verify_csrf_token($csrfToken)) {
        $error = 'Session security token expired. Please try again.';
    } else {
        try {
            if (attempt_admin_login($username, $password)) {
                header('Location: dashboard.php');
                exit;
            } else {
                $error = 'Invalid username or password.';
            }
        } catch (RuntimeException $e) {
            $error = $e->getMessage();
        }
    }
}
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login — HEA Link</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,500;0,600;0,700;1,700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../style.css">
</head>
<body>
    <div class="r" style="min-height: 100vh; display: flex; align-items: center; justify-content: center;">
        <!-- Exact Ambient Glowing Orbs -->
        <div class="o" style="width:520px;height:520px;background:#2563eb;left:-120px;top:-100px"></div>
        <div class="o" style="width:460px;height:460px;background:#14b8a6;right:-100px;top:180px"></div>
        <div class="o" style="width:480px;height:480px;background:#7c3aed;left:30%;bottom:-160px"></div>

        <div class="z" style="width: 100%; max-width: 440px; padding: 20px;">
            <div class="g c" style="padding: 38px 32px; border-radius: 24px;">
                <!-- Brand Header -->
                <div style="text-align: center; margin-bottom: 26px;">
                    <a href="../index.php" class="f" style="align-items: center; justify-content: center; gap: 10px; margin-bottom: 12px;">
                        <span style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#38bdf8,#2563eb);box-shadow:0 0 20px rgba(56,189,248,.6);display:inline-block"></span>
                        <span style="font-size:22px"><b style="font-style:italic">HEA</b> <span class="k">Link</span></span>
                    </a>
                    <span class="t k" style="font-size: 11px; padding: 4px 12px;">ADMIN CONTROL PANEL</span>
                </div>

                <?php if (!empty($error)): ?>
                    <div style="background: rgba(239,68,68,0.2); border: 1px solid rgba(239,68,68,0.4); color: #fca5a5; padding: 12px 14px; border-radius: 12px; font-size: 13px; margin-bottom: 20px; text-align: center;">
                        <?= h($error) ?>
                    </div>
                <?php endif; ?>

                <form method="POST" action="login.php">
                    <input type="hidden" name="csrf_token" value="<?= h(get_csrf_token()) ?>">

                    <div style="margin-bottom: 18px;">
                        <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 8px;">Username</label>
                        <input type="text" name="username" class="i" placeholder="e.g. admin" required autofocus autocomplete="username">
                    </div>

                    <div style="margin-bottom: 24px;">
                        <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 8px;">Password</label>
                        <input type="password" name="password" class="i" placeholder="••••••••" required autocomplete="current-password">
                    </div>

                    <button type="submit" class="b" style="width: 100%; box-sizing: border-box; justify-content: center; font-size: 15px; padding: 13px;">
                        Sign in to Dashboard
                    </button>
                </form>

                <div class="g" style="margin-top: 22px; padding: 14px; border-radius: 14px; text-align: center; font-size: 12px; background: rgba(255,255,255,0.06);">
                    <p class="m" style="margin-bottom: 4px;">Default Initial Credentials:</p>
                    <p><b class="k">admin</b> &nbsp;|&nbsp; <b class="k">Admin@123</b></p>
                </div>

                <div style="text-align: center; margin-top: 22px;">
                    <a href="../index.php" class="m" style="font-size: 13px; transition: color 0.2s;">← Back to Main Website</a>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
