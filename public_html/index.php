<?php
/**
 * HEA Link — Landing & Application Interface
 * Exactly matches 1:1 with Main.dc.html Design Reference
 * Backed by PHP 8 + SQLite Engine
 */

require_once __DIR__ . '/inc/functions.php';

init_session();
$csrfToken = get_csrf_token();
$baseUrl = get_base_url();
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="<?= h($csrfToken) ?>">
    <meta name="base-url" content="<?= h($baseUrl) ?>">
    <title>HEA Link — Landing</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,500;0,600;0,700;1,700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="r" style="min-height: 2000px">
        <!-- Exact Glowing Ambient Orbs from Reference -->
        <div class="o" style="width:520px;height:520px;background:#2563eb;left:-120px;top:-100px"></div>
        <div class="o" style="width:460px;height:460px;background:#14b8a6;right:-100px;top:180px"></div>
        <div class="o" style="width:480px;height:480px;background:#7c3aed;left:30%;bottom:-160px"></div>

        <div class="z">
            <!-- Exact Pill Navigation Bar -->
            <div class="w f" style="align-items:center;justify-content:space-between;padding-top:20px">
                <div class="g f" style="width:100%;align-items:center;justify-content:space-between;padding:12px 22px;border-radius:99px;box-sizing:border-box">
                    <a href="index.php" class="f" style="align-items:center;gap:10px">
                        <span style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#38bdf8,#2563eb);box-shadow:0 0 20px rgba(56,189,248,.6);display:inline-block"></span>
                        <span style="font-size:20px"><b style="font-style:italic">HEA</b> <span class="k">Link</span></span>
                    </a>
                    
                    <div class="m nav-links-desktop" style="font-size:14px;display:flex;gap:30px">
                        <a href="#features">Features</a>
                        <a href="#capabilities">Capabilities</a>
                        <a href="#how-it-works">How it works</a>
                        <a href="#pricing">Pricing</a>
                    </div>

                    <div class="f" style="gap:12px;align-items:center">
                        <a href="admin/login.php" style="font-size:14px;color:#eaf0ff;cursor:pointer">Log in</a>
                        <a href="#pricing" class="b" style="padding:10px 18px">Sign up free</a>
                    </div>
                </div>
            </div>

            <!-- Exact Hero Section & Glass Shortener -->
            <div class="w" style="text-align:center;padding-top:90px" id="hero">
                <span class="t k" style="padding:6px 14px;font-size:12px">✦ New: AI-suggested short links</span>
                
                <h1 class="hero-h1" style="font-size:60px;line-height:1.12;font-weight:700;margin:22px 0 18px">
                    Short links, QR codes &amp; bio pages —<br>
                    <span style="background:linear-gradient(90deg,#60a5fa,#5eead4);-webkit-background-clip:text;background-clip:text;color:transparent">all in one place</span>
                </h1>
                
                <p class="m" style="font-size:18px;line-height:1.7">
                    Create branded short links, scannable QR codes and link-in-bio pages,<br>
                    then see exactly who clicks — with HEA Link.
                </p>

                <!-- Interactive Glass Card (Shortener & QR Code Generator) -->
                <div class="g c" style="max-width:720px;margin:44px auto 0;text-align:left;padding:26px">
                    <div class="f" style="gap:10px;margin-bottom:16px">
                        <span class="t tab-active" id="tabLink" style="padding:7px 14px;font-size:13px;cursor:pointer">Short link</span>
                        <span class="t" id="tabQR" style="padding:7px 14px;font-size:13px;cursor:pointer">QR code</span>
                    </div>

                    <p style="font-size:13px;font-weight:600;margin-bottom:8px">Paste your long link</p>

                    <form id="shortenerForm">
                        <div class="f" style="gap:12px;flex-wrap:wrap">
                            <input type="url" id="urlInput" class="i m" style="flex:1;min-width:260px" placeholder="https://example.com/a-very-long-page-address" value="https://example.com/a-very-long-page-address" required />
                            <button type="submit" id="shortenBtn" class="b" style="white-space:nowrap">Shorten link</button>
                        </div>

                        <!-- Optional Back-half toggle -->
                        <div style="margin-top:10px;">
                            <span style="font-size:11px;color:#a9b6d6;cursor:pointer;" onclick="document.getElementById('customSlugWrap').style.display = document.getElementById('customSlugWrap').style.display === 'none' ? 'block' : 'none';">
                                ⚙️ <u>Custom back-half (optional)</u>
                            </span>
                            <div id="customSlugWrap" style="display:none;margin-top:8px;">
                                <input type="text" id="customInput" class="i m" placeholder="e.g. summer-sale" style="padding:10px 14px;font-size:13px;" />
                            </div>
                        </div>
                    </form>

                    <!-- Real Output Box -->
                    <div class="g f" id="resultCard" style="align-items:center;justify-content:space-between;padding:12px 16px;border-radius:14px;margin-top:14px">
                        <div>
                            <p class="m" style="font-size:11px">Your short link</p>
                            <p id="shortUrlDisplay" style="font-weight:600;color:#7cb2ff;font-size:15px"><?= h($baseUrl) ?>/summer-sale</p>
                        </div>
                        <div class="f" style="gap:8px">
                            <button type="button" class="n" id="copyBtn"><span id="copyIcon">📋</span> <span id="copyText">Copy</span></button>
                            <button type="button" class="n" id="viewQrBtn"><span>📱</span> QR code</button>
                        </div>
                    </div>

                    <!-- Dynamic QR Modal Preview -->
                    <div id="qrPreviewContainer" style="display:none;margin-top:16px;text-align:center;padding:18px;background:rgba(255,255,255,0.05);border-radius:14px;border:1px solid rgba(255,255,255,0.12)">
                        <img id="qrImage" src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=<?= urlencode($baseUrl . '/summer-sale') ?>&color=2563eb&bgcolor=ffffff" alt="HEA Link QR Code" style="border-radius:10px;padding:8px;background:#ffffff;box-shadow:0 8px 24px rgba(0,0,0,.4)">
                        <p class="m" style="font-size:12px;margin-top:8px">Dynamic Scannable QR Code</p>
                        <a id="downloadQrBtn" href="https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=<?= urlencode($baseUrl . '/summer-sale') ?>&color=2563eb&bgcolor=ffffff" download="healink-qr.png" target="_blank" class="n" style="margin-top:8px;font-size:12px">Download QR PNG</a>
                    </div>

                    <p class="m" style="font-size:12px;margin-top:14px">By shortening a link you agree to our Terms and Acceptable Use Policy.</p>
                </div>
            </div>

            <!-- Exact Section: EVERYTHING YOU NEED (4 Cards) -->
            <div id="features" class="w" style="padding-top:110px;text-align:center">
                <p class="k" style="font-size:12px;font-weight:600;letter-spacing:.12em;margin-bottom:10px">EVERYTHING YOU NEED</p>
                <h2>One platform for every link you share</h2>
                <div class="gr features-grid-4" style="grid-template-columns:repeat(4,1fr);margin-top:40px;text-align:left">
                    <div class="g c">
                        <div style="width:42px;height:42px;border-radius:12px;background:rgba(96,165,250,.25);margin-bottom:14px;display:flex;align-items:center;justify-content:center;font-size:20px">🔗</div>
                        <h3>Short links</h3>
                        <p class="m" style="font-size:13px;margin-top:8px;line-height:1.6">Custom back-halves, tags, folders and editable destinations.</p>
                    </div>

                    <div class="g c">
                        <div style="width:42px;height:42px;border-radius:12px;background:rgba(20,184,166,.25);margin-bottom:14px;display:flex;align-items:center;justify-content:center;font-size:20px">📱</div>
                        <h3>Dynamic QR codes</h3>
                        <p class="m" style="font-size:13px;margin-top:8px;line-height:1.6">Your colours and logo, PNG or SVG — change the destination after printing.</p>
                    </div>

                    <div class="g c">
                        <div style="width:42px;height:42px;border-radius:12px;background:rgba(124,58,237,.25);margin-bottom:14px;display:flex;align-items:center;justify-content:center;font-size:20px">📄</div>
                        <h3>Link-in-bio pages</h3>
                        <p class="m" style="font-size:13px;margin-top:8px;line-height:1.6">One mobile page for all your links, ready for your social profiles.</p>
                    </div>

                    <div class="g c">
                        <div style="width:42px;height:42px;border-radius:12px;background:rgba(56,189,248,.25);margin-bottom:14px;display:flex;align-items:center;justify-content:center;font-size:20px">📊</div>
                        <h3>Analytics</h3>
                        <p class="m" style="font-size:13px;margin-top:8px;line-height:1.6">Clicks over time, countries, devices and referrers, compared with the last period.</p>
                    </div>
                </div>
            </div>

            <!-- Exact Section: ONLY ON HEA LINK (Left + Right 6 cards) -->
            <div id="capabilities" class="w gr advanced-split" style="grid-template-columns:1fr 1.5fr;gap:50px;align-items:center;padding-top:110px">
                <div>
                    <p class="k" style="font-size:12px;font-weight:600;letter-spacing:.12em">ONLY ON HEA LINK</p>
                    <h2 style="text-align:left;margin:10px 0 14px">Smarter links with advanced controls</h2>
                    <p class="m" style="line-height:1.7;margin-bottom:22px">Go beyond shortening: protect links, send visitors to the right page automatically, and let AI do the busy work.</p>
                    <a href="#pricing" class="b">Explore all features</a>
                </div>

                <div class="gr" style="grid-template-columns:1fr 1fr;gap:14px">
                    <div class="g c" style="border-radius:18px;padding:16px">
                        <h3 style="font-size:14px">🤖 AI assistant</h3>
                        <p class="m" style="font-size:12px;margin-top:6px;line-height:1.5">Suggests readable back-halves and summarises your analytics.</p>
                    </div>
                    <div class="g c" style="border-radius:18px;padding:16px">
                        <h3 style="font-size:14px">🔒 Password &amp; expiry</h3>
                        <p class="m" style="font-size:12px;margin-top:6px;line-height:1.5">Lock a link or let it expire on a date you choose.</p>
                    </div>
                    <div class="g c" style="border-radius:18px;padding:16px">
                        <h3 style="font-size:14px">🌍 Dynamic routing</h3>
                        <p class="m" style="font-size:12px;margin-top:6px;line-height:1.5">Different destinations by country, device, language or time.</p>
                    </div>
                    <div class="g c" style="border-radius:18px;padding:16px">
                        <h3 style="font-size:14px">🎯 UTM builder</h3>
                        <p class="m" style="font-size:12px;margin-top:6px;line-height:1.5">Campaign-ready URLs without any technical knowledge.</p>
                    </div>
                    <div class="g c" style="border-radius:18px;padding:16px">
                        <h3 style="font-size:14px">👥 Team workspaces</h3>
                        <p class="m" style="font-size:12px;margin-top:6px;line-height:1.5">Roles for every member and a full activity log.</p>
                    </div>
                    <div class="g c" style="border-radius:18px;padding:16px">
                        <h3 style="font-size:14px">🛡️ Safe link preview</h3>
                        <p class="m" style="font-size:12px;margin-top:6px;line-height:1.5">Visitors can check where a link goes before opening it.</p>
                    </div>
                </div>
            </div>

            <!-- Exact Section: How HEA Link works (3 Cards) -->
            <div id="how-it-works" class="w" style="padding-top:110px">
                <h2>How HEA Link works</h2>
                <div class="gr steps-grid-3" style="grid-template-columns:repeat(3,1fr);margin-top:36px">
                    <div class="g c">
                        <div style="width:36px;height:36px;border-radius:50%;background:#2563eb;display:flex;align-items:center;justify-content:center;font-weight:700;margin-bottom:12px">1</div>
                        <h3>Paste</h3>
                        <p class="m" style="font-size:13px;margin-top:6px;line-height:1.6">Drop in any long URL — or import a whole CSV at once.</p>
                    </div>
                    <div class="g c">
                        <div style="width:36px;height:36px;border-radius:50%;background:#2563eb;display:flex;align-items:center;justify-content:center;font-weight:700;margin-bottom:12px">2</div>
                        <h3>Customise</h3>
                        <p class="m" style="font-size:13px;margin-top:6px;line-height:1.6">Pick a back-half, add a QR code, a password or an expiry date.</p>
                    </div>
                    <div class="g c">
                        <div style="width:36px;height:36px;border-radius:50%;background:#2563eb;display:flex;align-items:center;justify-content:center;font-weight:700;margin-bottom:12px">3</div>
                        <h3>Share &amp; track</h3>
                        <p class="m" style="font-size:13px;margin-top:6px;line-height:1.6">Share anywhere and watch every click arrive in your dashboard.</p>
                    </div>
                </div>
            </div>

            <!-- Exact Section: Simple pricing (3 Cards) -->
            <div id="pricing" class="w" style="padding-top:110px;text-align:center">
                <h2>Simple pricing</h2>
                <p class="m" style="margin:8px 0 36px">Start free. Upgrade when you need more.</p>
                <div class="gr pricing-grid-3" style="grid-template-columns:repeat(3,1fr);text-align:left">
                    <div class="g c" style="padding:28px">
                        <h3>Free</h3>
                        <p style="font-size:36px;font-weight:700;margin:14px 0">Rs 0 <span class="m" style="font-size:14px;font-weight:400">/ month</span></p>
                        <ul class="m" style="padding-left:18px;font-size:13px;min-height:110px;list-style:none;padding-left:0">
                            <li style="margin:8px 0">✓ 50 short links a month</li>
                            <li style="margin:8px 0">✓ Basic QR codes</li>
                            <li style="margin:8px 0">✓ 7-day analytics</li>
                        </ul>
                        <a href="#hero" class="n" style="width:100%;box-sizing:border-box">Get started</a>
                    </div>

                    <!-- Glowing Pro Card -->
                    <div class="g c" style="border:1px solid rgba(96,165,250,.8);box-shadow:0 0 50px rgba(59,130,246,.45),inset 0 1px 0 rgba(255,255,255,.4);padding:28px">
                        <h3>Pro <span class="t" style="margin-left:8px">Most popular</span></h3>
                        <p style="font-size:36px;font-weight:700;margin:14px 0">Rs 1,499 <span class="m" style="font-size:14px;font-weight:400">/ month</span></p>
                        <ul class="m" style="padding-left:18px;font-size:13px;min-height:110px;list-style:none;padding-left:0">
                            <li style="margin:8px 0">✓ Unlimited short links</li>
                            <li style="margin:8px 0">✓ Dynamic QR with your logo</li>
                            <li style="margin:8px 0">✓ Password, expiry &amp; UTM builder</li>
                            <li style="margin:8px 0">✓ Full analytics + AI summary</li>
                        </ul>
                        <a href="admin/login.php" class="b" style="width:100%;box-sizing:border-box">Start Pro</a>
                    </div>

                    <div class="g c" style="padding:28px">
                        <h3>Business</h3>
                        <p style="font-size:36px;font-weight:700;margin:14px 0">Rs 4,999 <span class="m" style="font-size:14px;font-weight:400">/ month</span></p>
                        <ul class="m" style="padding-left:18px;font-size:13px;min-height:110px;list-style:none;padding-left:0">
                            <li style="margin:8px 0">✓ Everything in Pro</li>
                            <li style="margin:8px 0">✓ Custom domains</li>
                            <li style="margin:8px 0">✓ Dynamic routing &amp; API</li>
                            <li style="margin:8px 0">✓ Team workspaces</li>
                        </ul>
                        <a href="admin/login.php" class="n" style="width:100%;box-sizing:border-box">Contact us</a>
                    </div>
                </div>
            </div>

            <!-- Exact Section: Ready to share smarter links? CTA -->
            <div class="w" style="padding-top:90px">
                <div class="g f cta-flex" style="align-items:center;justify-content:space-between;padding:40px 44px;background:linear-gradient(135deg,rgba(37,99,235,.35),rgba(20,184,166,.2))">
                    <div>
                        <h2 style="text-align:left;font-size:28px">Ready to share smarter links?</h2>
                        <p class="m" style="margin-top:8px;font-size:14px">Create your free HEA Link account in under a minute.</p>
                    </div>
                    <a href="admin/login.php" class="b" style="background:linear-gradient(135deg,#5eead4,#2dd4bf);color:#042f2e;box-shadow:0 8px 24px rgba(45,212,191,.45)">Sign up free</a>
                </div>
            </div>

            <!-- Exact Section: Footer -->
            <div class="w f footer-flex" style="justify-content:space-between;padding-top:80px;padding-bottom:50px;font-size:13px">
                <div>
                    <span class="f" style="align-items:center;gap:10px">
                        <span style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#38bdf8,#2563eb);box-shadow:0 0 20px rgba(56,189,248,.6);display:inline-block"></span>
                        <span style="font-size:20px"><b style="font-style:italic">HEA</b> <span class="k">Link</span></span>
                    </span>
                    <p class="m" style="margin-top:10px;max-width:240px">Short links, QR codes and bio pages with analytics.</p>
                    <p class="m" style="margin-top:24px">© 2026 HEA Link. All rights reserved.</p>
                </div>
                <div class="f m" style="gap:56px;line-height:2.2">
                    <div><b style="color:#fff">Product</b><br>Links<br>QR codes<br>Bio pages<br>Pricing</div>
                    <div><b style="color:#fff">Company</b><br>About<br>Blog<br>Contact<br><a href="admin/login.php" style="color:#60a5fa">Admin Panel</a></div>
                    <div><b style="color:#fff">Legal</b><br>Privacy<br>Terms<br>Report abuse</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Notification Toast -->
    <div id="toast" class="toast"></div>

    <script src="script.js"></script>
</body>
</html>
