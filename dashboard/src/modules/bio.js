import {
  $, $$, state, cleanSafeStr, getStoredPages, getAuthToken, handleUnauthorizedSession,
  deletePage, syncPagesFromServer, toast, copy
} from './state.js';
import { navigate } from './router.js';

export function renderPages(container, initialMode) {

  function isHexLight(hex) {
    if (!hex || typeof hex !== "string") return false;
    const clean = hex.replace("#", "").trim();
    if (clean.length < 6) return false;
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return ((r * 299 + g * 587 + b * 114) / 1000) > 140;
  }

  function isTemplateLight(t) {
    if (t.textColor && t.textColor !== "#ffffff" && t.textColor !== "#fff") return true;
    return isHexLight(t.bgColor);
  }


  let pages = getStoredPages();

  const origin = window.location.origin;

  let mode = initialMode || (pages.length === 0 ? 'catalog' : 'list');

  let activeCategory = 'All templates';

  // 12 High-Converting Diverse Industry Templates

  const templates = [

    {

      id: 'grand_hotel',

      category: 'Business & Hospitality',

      badge: 'HOSPITALITY',

      title: 'The Grand Hotel',

      tagline: 'Your new escape awaits',

      accent: '#c5a059',

      bgColor: '#161b26',

      textColor: '#ffffff',

      cardBg: '#1f2737',

      btnBg: '#e2d5c3',

      btnColor: '#181e29',

      btnShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',

      btn1Text: 'Website',

      btn1Url: 'https://thegrandhotel.example.com',

      btn2Text: 'Book your stay',

      btn2Url: 'https://thegrandhotel.example.com/book',

      socials: ['instagram', 'mail', 'youtube'],

      avatarType: 'hotel',

      cardType: 'hotel_sunset',

      desc: 'Dark luxury hospitality aesthetic with champagne gold accents and direct booking actions.'

    },

    {

      id: 'hearth_home',

      category: 'Retail & Ecommerce',

      badge: 'INTERIOR & DECOR',

      title: 'Hearth & Home',

      tagline: 'Create a space you love',

      accent: '#0d9488',

      bgColor: '#f7f4ee',

      textColor: '#1a202c',

      cardBg: '#ffffff',

      btnBg: '#0f766e',

      btnColor: '#ffffff',

      btnShadow: '0 4px 0 #094e49',

      btn1Text: 'Shop our website',

      btn1Url: 'https://hearthhome.example.com',

      btn2Text: 'Find a store',

      btn2Url: 'https://hearthhome.example.com/locations',

      socials: ['instagram', 'mail', 'x'],

      avatarType: 'hh_monogram',

      cardType: 'armchair',

      desc: 'Warm editorial cream layout with retro-drop shadow buttons and Scandinavian lookbook.'

    },

    {

      id: 'the_brew',

      category: 'Food & Drink',

      badge: 'CAFE & ROASTERY',

      title: 'The Brew Co.',

      tagline: 'Fresh roasts & seasonal cold brews',

      accent: '#ea580c',

      bgColor: '#faf6f0',

      textColor: '#1c1917',

      cardBg: '#ffffff',

      btnBg: '#ea580c',

      btnColor: '#ffffff',

      btnShadow: '0 4px 0 #9a3412',

      btn1Text: 'New drinks',

      btn1Url: 'https://thebrew.example.com/menu',

      btn2Text: 'Order whole beans',

      btn2Url: 'https://thebrew.example.com/beans',

      socials: ['instagram', 'mail', 'tiktok'],

      avatarType: 'brew_badge',

      cardType: 'coffee_bag',

      desc: 'Warm terracotta artisan cafe theme with coffee roast pouch and vibrant menu buttons.'

    },

    {

      id: 'cyberpulse_music',

      category: 'Creator & Music',

      badge: 'MUSIC & ARTIST',

      title: 'CyberPulse',

      tagline: "New EP 'Echoes' Streaming Now",

      accent: '#00c6ff',

      bgColor: '#060919',

      textColor: '#ffffff',

      cardBg: '#0f172a',

      btnBg: 'linear-gradient(135deg, #0070f3, #00c6ff)',

      btnColor: '#ffffff',

      btnShadow: '0 4px 16px rgba(0, 198, 255, 0.4)',

      btn1Text: 'Stream on Spotify ↗',

      btn1Url: 'https://spotify.com/cyberpulse',

      btn2Text: 'World Tour Tickets ↗',

      btn2Url: 'https://cyberpulse.live/tour',

      socials: ['spotify', 'youtube', 'instagram', 'x'],

      avatarType: 'cyber_headphones',

      cardType: 'music_player',

      desc: 'High-energy cyber cyan & violet theme for DJs, producers, and electronic artists.'

    },

    {

      id: 'glow_skincare',

      category: 'Retail & Ecommerce',

      badge: 'BEAUTY & WELLNESS',

      title: 'Glow Beauty Lab',

      tagline: 'Clean botanical skincare formulas',

      accent: '#f43f5e',

      bgColor: '#fff5f7',

      textColor: '#27272a',

      cardBg: '#ffffff',

      btnBg: '#f43f5e',

      btnColor: '#ffffff',

      btnShadow: '0 4px 12px rgba(244, 63, 94, 0.3)',

      btn1Text: 'Shop Bestseller Serums',

      btn1Url: 'https://glowbeauty.example.com/shop',

      btn2Text: 'Take the 60s Skin Quiz',

      btn2Url: 'https://glowbeauty.example.com/quiz',

      socials: ['instagram', 'tiktok', 'mail'],

      avatarType: 'beauty_dropper',

      cardType: 'skincare_bottle',

      desc: 'Soft blush rose aesthetic with botanical serum highlights for beauty and cosmetic brands.'

    },

    {

      id: 'devforge_hub',

      category: 'Tech & Web3',

      badge: 'DEVELOPER & SAAS',

      title: 'DevForge CLI',

      tagline: 'Lightning-fast cloud developer workflows',

      accent: '#D4FF24',

      bgColor: '#080d1a',

      textColor: '#ffffff',

      cardBg: '#0f172a',

      btnBg: '#D4FF24',

      btnColor: '#050914',

      btnShadow: '0 4px 18px rgba(212, 255, 36, 0.35)',

      btn1Text: 'GitHub Repository (★ 18.4k)',

      btn1Url: 'https://github.com/devforge',

      btn2Text: 'Read the Documentation',

      btn2Url: 'https://docs.devforge.example.com',

      socials: ['github', 'x', 'mail'],

      avatarType: 'terminal_code',

      cardType: 'code_terminal',

      desc: 'Dark matrix terminal theme tailored for open-source engineers, SDKs, and dev tools.'

    },

    {

      id: 'fitapex_coach',

      category: 'Health & Fitness',

      badge: 'FITNESS & TRAINING',

      title: 'FitApex Coaching',

      tagline: 'Elite 1-on-1 strength & nutrition plans',

      accent: '#10b981',

      bgColor: '#09101d',

      textColor: '#ffffff',

      cardBg: '#131e33',

      btnBg: '#10b981',

      btnColor: '#ffffff',

      btnShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',

      btn1Text: 'Apply for 1-on-1 Coaching',

      btn1Url: 'https://fitapex.example.com/apply',

      btn2Text: 'Download Free Workout Plan',

      btn2Url: 'https://fitapex.example.com/guide',

      socials: ['instagram', 'youtube', 'tiktok'],

      avatarType: 'fitness_apex',

      cardType: 'fitness_stats',

      desc: 'High-contrast athletic theme with transformation proof for trainers and fitness creators.'

    },

    {

      id: 'atelier_bistro',

      category: 'Food & Drink',

      badge: 'FINE DINING',

      title: 'Atelier Bistro & Bar',

      tagline: 'Seasonal gastronomy & craft cocktails',

      accent: '#fbbf24',

      bgColor: '#0a0d14',

      textColor: '#ffffff',

      cardBg: '#141a29',

      btnBg: '#fbbf24',

      btnColor: '#0a0d14',

      btnShadow: '0 4px 16px rgba(251, 191, 36, 0.35)',

      btn1Text: 'Reserve a Table Online',

      btn1Url: 'https://atelierbistro.example.com/reserve',

      btn2Text: "View Chef's Tasting Menu",

      btn2Url: 'https://atelierbistro.example.com/menu',

      socials: ['instagram', 'mail', 'x'],

      avatarType: 'chef_crest',

      cardType: 'gourmet_dish',

      desc: 'Midnight black & champagne gold palette for luxury restaurants, bistros, and lounges.'

    },

    {

      id: 'aura_photography',

      category: 'Creator & Music',

      badge: 'PHOTOGRAPHY',

      title: 'Aura Visuals',

      tagline: 'Timeless editorial wedding & portrait stories',

      accent: '#a855f7',

      bgColor: '#111216',

      textColor: '#ffffff',

      cardBg: '#1a1c23',

      btnBg: '#f4f4f5',

      btnColor: '#09090b',

      btnShadow: 'none',

      btn1Text: 'View Portfolio Galleries',

      btn1Url: 'https://auravisuals.example.com/portfolio',

      btn2Text: '2026 Wedding Date Inquiries',

      btn2Url: 'https://auravisuals.example.com/contact',

      socials: ['instagram', 'mail', 'pinterest'],

      avatarType: 'camera_aperture',

      cardType: 'photo_frame',

      desc: 'Monochrome editorial layout highlighting visual storytelling and client inquiries.'

    },

    {

      id: 'nexus_web3',

      category: 'Tech & Web3',

      badge: 'FINANCE & WEB3',

      title: 'Nexus Capital',

      tagline: 'Investing in decentralized intelligence',

      accent: '#38bdf8',

      bgColor: '#050716',

      textColor: '#ffffff',

      cardBg: '#0c122b',

      btnBg: 'linear-gradient(135deg, #0ea5e9, #6366f1)',

      btnColor: '#ffffff',

      btnShadow: '0 4px 16px rgba(14, 165, 233, 0.4)',

      btn1Text: 'Read Q1 Research Paper',

      btn1Url: 'https://nexuscapital.example.com/research',

      btn2Text: 'Join Governance Community',

      btn2Url: 'https://t.me/nexusweb3',

      socials: ['x', 'telegram', 'github'],

      avatarType: 'web3_cube',

      cardType: 'web3_stats',

      desc: 'Futuristic blockchain and DeFi hub layout with live protocol analytics tickers.'

    },

    {

      id: 'elena_books',

      category: 'Creator & Music',

      badge: 'AUTHOR & PODCAST',

      title: 'Elena Vance Books',

      tagline: 'Bestselling dark fantasy author & podcaster',

      accent: '#d97706',

      bgColor: '#fbf9f4',

      textColor: '#1c1917',

      cardBg: '#ffffff',

      btnBg: '#1e293b',

      btnColor: '#ffffff',

      btnShadow: '0 4px 0 #0f172a',

      btn1Text: 'Order The Silent Isle',

      btn1Url: 'https://elenavance.example.com/books',

      btn2Text: 'Listen to Writer Podcast',

      btn2Url: 'https://elenavance.example.com/podcast',

      socials: ['instagram', 'spotify', 'mail'],

      avatarType: 'quill_book',

      cardType: 'book_jacket',

      desc: 'Warm parchment paper aesthetic designed for authors, poets, journalists, and book clubs.'

    },

    {

      id: 'nova_agency',

      category: 'Business & Hospitality',

      badge: 'DIGITAL AGENCY',

      title: 'Nova Creative Studio',

      tagline: 'Award-winning 3D branding & digital products',

      accent: '#8b5cf6',

      bgColor: '#080c1d',

      textColor: '#ffffff',

      cardBg: '#111836',

      btnBg: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',

      btnColor: '#ffffff',

      btnShadow: '0 4px 18px rgba(139, 92, 246, 0.4)',

      btn1Text: 'Explore Case Studies',

      btn1Url: 'https://novastudio.example.com/work',

      btn2Text: 'Schedule Discovery Call',

      btn2Url: 'https://novastudio.example.com/contact',

      socials: ['linkedin', 'x', 'instagram'],

      avatarType: 'prism_3d',

      cardType: 'agency_showcase',

      desc: 'Ultra-modern glassmorphic agency portfolio with high-contrast gradients and case studies.'

    }

  ];

  let selectedTemplate = templates[0];

  let qrColor = '#00c6ff';

  let chosenDomain = 'healink.store';

  // SVG Social Icons Helper

  function renderSocialIconSvg(name, color = 'currentColor') {

    switch (name) {

      case 'instagram':

        return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>`;

      case 'mail':

        return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`;

      case 'youtube':

        return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="${color}"></polygon></svg>`;

      case 'x':

        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="${color}"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;

      case 'spotify':

        return `<svg width="15" height="15" viewBox="0 0 24 24" fill="${color}"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.48.66.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>`;

      case 'tiktok':

        return `<svg width="15" height="15" viewBox="0 0 24 24" fill="${color}"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.46 6.27 6.27 0 0 0 1.88-4.47V8.65a8.27 8.27 0 0 0 4.9 1.6V6.79a4.85 4.85 0 0 1-1.01-.1z"/></svg>`;

      case 'github':

        return `<svg width="15" height="15" viewBox="0 0 24 24" fill="${color}"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>`;

      case 'linkedin':

        return `<svg width="15" height="15" viewBox="0 0 24 24" fill="${color}"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>`;

      case 'telegram':

        return `<svg width="15" height="15" viewBox="0 0 24 24" fill="${color}"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.16l-1.92 9.07c-.14.65-.53.81-1.08.5l-2.97-2.19-1.43 1.38c-.16.16-.29.29-.6.29l.21-3.03 5.51-4.98c.24-.21-.05-.33-.37-.12l-6.81 4.29-2.94-.92c-.64-.2-.65-.64.13-.95l11.48-4.42c.53-.2 1 .12.8 1.08z"/></svg>`;

      default:

        return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line></svg>`;

    }

  }

  // Template Avatar SVG Helper

  function renderTemplateAvatar(t) {

    switch (t.avatarType) {

      case 'hotel':

        return `<div style="width:52px;height:52px;border-radius:50%;background:#1e2536;border:2px solid #c5a059;display:grid;place-items:center;box-shadow:0 6px 18px rgba(197, 160, 89, 0.35);">

          <svg width="24" height="24" viewBox="0 0 24 24" fill="#c5a059"><path d="M19 2H5c-1.1 0-2 .9-2 2v17h2v-2h14v2h2V4c0-1.1-.9-2-2-2zm-7 3c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-4 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm8 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm0 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-4 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-4 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm0 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm4 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm4 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/></svg>

        </div>`;

      case 'hh_monogram':

        return `<div style="width:54px;height:54px;border-radius:50%;background:#ffffff;border:2px solid #1a202c;display:grid;place-items:center;box-shadow:0 6px 16px rgba(0,0,0,0.15);">

          <span style="font-family:serif;font-weight:900;font-size:24px;color:#1a202c;letter-spacing:-1px;">hH</span>

        </div>`;

      case 'brew_badge':

        return `<div style="width:54px;height:54px;border-radius:50%;background:#ea580c;border:2px solid #ffffff;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(234, 88, 12, 0.4);">

          <span style="font-size:9px;font-weight:900;letter-spacing:1px;color:#ffffff;line-height:1;">THE</span>

          <span style="font-size:11px;font-weight:900;color:#ffffff;line-height:1;">BREW</span>

        </div>`;

      case 'cyber_headphones':

        return `<div style="width:52px;height:52px;border-radius:50%;background:#090d22;border:2px solid #00c6ff;display:grid;place-items:center;box-shadow:0 0 20px rgba(0, 198, 255, 0.5);">

          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00c6ff" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>

        </div>`;

      case 'beauty_dropper':

        return `<div style="width:52px;height:52px;border-radius:50%;background:#fff1f2;border:2px solid #f43f5e;display:grid;place-items:center;box-shadow:0 6px 18px rgba(244, 63, 94, 0.25);">

          <span style="font-size:22px;">✨</span>

        </div>`;

      case 'terminal_code':

        return `<div style="width:52px;height:52px;border-radius:50%;background:#0a0f1d;border:2px solid #D4FF24;display:grid;place-items:center;box-shadow:0 0 18px rgba(212, 255, 36, 0.45);">

          <span style="font-family:monospace;font-weight:900;font-size:18px;color:#D4FF24;">&gt;_</span>

        </div>`;

      case 'fitness_apex':

        return `<div style="width:52px;height:52px;border-radius:50%;background:#131c2e;border:2px solid #10b981;display:grid;place-items:center;box-shadow:0 6px 18px rgba(16, 185, 129, 0.35);">

          <span style="font-size:22px;">🏋️</span>

        </div>`;

      case 'chef_crest':

        return `<div style="width:52px;height:52px;border-radius:50%;background:#141a29;border:2px solid #fbbf24;display:grid;place-items:center;box-shadow:0 6px 18px rgba(251, 191, 36, 0.35);">

          <span style="font-size:22px;">🍷</span>

        </div>`;

      case 'camera_aperture':

        return `<div style="width:52px;height:52px;border-radius:50%;background:#181920;border:2px solid #e4e4e7;display:grid;place-items:center;box-shadow:0 6px 18px rgba(255, 255, 255, 0.15);">

          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e4e4e7" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="14.31" y1="8" x2="20.05" y2="17.94"></line><line x1="9.69" y1="8" x2="21.17" y2="8"></line><line x1="7.38" y1="12" x2="13.12" y2="2.06"></line><line x1="9.69" y1="16" x2="3.95" y2="6.06"></line><line x1="14.31" y1="16" x2="2.83" y2="16"></line><line x1="16.62" y1="12" x2="10.88" y2="21.94"></line></svg>

        </div>`;

      case 'web3_cube':

        return `<div style="width:52px;height:52px;border-radius:50%;background:#09102b;border:2px solid #38bdf8;display:grid;place-items:center;box-shadow:0 0 20px rgba(56, 189, 248, 0.5);">

          <span style="font-size:22px;">🌐</span>

        </div>`;

      case 'quill_book':

        return `<div style="width:52px;height:52px;border-radius:50%;background:#ffffff;border:2px solid #d97706;display:grid;place-items:center;box-shadow:0 6px 16px rgba(217, 119, 6, 0.25);">

          <span style="font-size:22px;">📚</span>

        </div>`;

      case 'prism_3d':

      default:

        return `<div style="width:52px;height:52px;border-radius:50%;background:#111836;border:2px solid #8b5cf6;display:grid;place-items:center;box-shadow:0 0 20px rgba(139, 92, 246, 0.45);">

          <span style="font-size:22px;">🚀</span>

        </div>`;

    }

  }

  // Template Feature Card SVG/HTML Helper

  function renderTemplateFeatureCard(t) {

    switch (t.cardType) {

      case 'hotel_sunset':

        return `<div style="width:100%;border-radius:12px;overflow:hidden;background:linear-gradient(180deg, #ea580c 0%, #7c2d12 40%, #0f172a 100%);padding:14px 12px;display:flex;flex-direction:column;justify-content:flex-end;height:100px;box-shadow:inset 0 0 30px rgba(0,0,0,0.5);">

          <div style="font-size:9px;font-weight:800;color:#fde047;text-transform:uppercase;letter-spacing:1px;">Featured Suite</div>

          <div style="font-weight:800;font-size:12px;color:#ffffff;margin-top:2px;">Oceanfront Luxury Villa</div>

          <div style="font-size:10px;color:#cbd5e1;margin-top:1px;">Private infinity pool &amp; concierge</div>

        </div>`;

      case 'armchair':

        return `<div style="width:100%;border-radius:12px;background:#ffffff;border:1px solid #e2e8f0;padding:12px;display:flex;align-items:center;gap:12px;box-shadow:0 4px 12px rgba(0,0,0,0.06);">

          <div style="width:48px;height:48px;border-radius:8px;background:#f1f5f9;display:grid;place-items:center;font-size:24px;flex-shrink:0;">🛋️</div>

          <div>

            <div style="font-size:10px;font-weight:800;color:#0f766e;text-transform:uppercase;">Our New Arrivals</div>

            <div style="font-weight:800;font-size:12px;color:#1e293b;">Nordic Lounge Chair</div>

            <div style="font-size:10px;color:#64748b;">In stock · Free shipping</div>

          </div>

        </div>`;

      case 'coffee_bag':

        return `<div style="width:100%;border-radius:12px;background:#ffffff;border:1px solid #fed7aa;padding:12px;display:flex;align-items:center;gap:12px;box-shadow:0 4px 12px rgba(234, 88, 12, 0.08);">

          <div style="width:48px;height:48px;border-radius:8px;background:#ffedd5;display:grid;place-items:center;font-size:24px;flex-shrink:0;">☕</div>

          <div>

            <div style="font-size:10px;font-weight:800;color:#ea580c;text-transform:uppercase;">Seasonal Blend</div>

            <div style="font-weight:800;font-size:12px;color:#1c1917;">Finca La Aurora Roast</div>

            <div style="font-size:10px;color:#78716c;">Notes of cacao &amp; citrus</div>

          </div>

        </div>`;

      case 'music_player':

        return `<div style="width:100%;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(0, 198, 255, 0.25);padding:10px 12px;display:flex;align-items:center;gap:10px;">

          <div style="width:40px;height:40px;border-radius:50%;background:#00c6ff;color:#000;display:grid;place-items:center;font-size:16px;font-weight:900;flex-shrink:0;box-shadow:0 0 12px #00c6ff;">▶</div>

          <div style="flex:1;">

            <div style="font-size:11px;font-weight:800;color:#ffffff;">Echoes EP (2026)</div>

            <div style="font-size:9px;color:#38bdf8;">12 Tracks · Synthwave</div>

            <div style="width:100%;height:3px;background:rgba(255,255,255,0.1);border-radius:3px;margin-top:6px;overflow:hidden;">

              <div style="width:65%;height:100%;background:#00c6ff;"></div>

            </div>

          </div>

        </div>`;

      case 'skincare_bottle':

        return `<div style="width:100%;border-radius:12px;background:#ffffff;border:1px solid #fecdd3;padding:12px;display:flex;align-items:center;gap:12px;box-shadow:0 4px 12px rgba(244, 63, 94, 0.08);">

          <div style="width:48px;height:48px;border-radius:8px;background:#ffe4e6;display:grid;place-items:center;font-size:24px;flex-shrink:0;">🧴</div>

          <div>

            <div style="font-size:10px;font-weight:800;color:#f43f5e;text-transform:uppercase;">Best Rated</div>

            <div style="font-weight:800;font-size:12px;color:#18181b;">Luminous Vitamin C</div>

            <div style="font-size:10px;color:#71717a;">★★★★★ 4.9 (12k reviews)</div>

          </div>

        </div>`;

      case 'code_terminal':

        return `<div style="width:100%;border-radius:10px;background:#050914;border:1px solid rgba(212, 255, 36, 0.25);padding:10px 12px;font-family:monospace;font-size:11px;text-align:left;">

          <div style="display:flex;gap:4px;margin-bottom:6px;">

            <span style="width:7px;height:7px;border-radius:50%;background:#ef4444;display:inline-block;"></span>

            <span style="width:7px;height:7px;border-radius:50%;background:#eab308;display:inline-block;"></span>

            <span style="width:7px;height:7px;border-radius:50%;background:#22c55e;display:inline-block;"></span>

          </div>

          <div style="color:#D4FF24;">$ npm i -g @devforge/cli</div>

          <div style="color:#64748b;font-size:10px;margin-top:2px;">✔ Zero-config cloud runner</div>

        </div>`;

      case 'fitness_stats':

        return `<div style="width:100%;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(16, 185, 129, 0.25);padding:10px 12px;display:flex;align-items:center;justify-content:space-between;">

          <div>

            <div style="font-size:10px;font-weight:800;color:#10b981;text-transform:uppercase;">Client Results</div>

            <div style="font-size:12px;font-weight:800;color:#ffffff;margin-top:2px;">12-Week Transformation</div>

            <div style="font-size:10px;color:#94a3b8;">+28% Strength PR</div>

          </div>

          <div style="font-size:22px;">🔥</div>

        </div>`;

      case 'gourmet_dish':

        return `<div style="width:100%;border-radius:12px;background:#141a29;border:1px solid rgba(251, 191, 36, 0.25);padding:10px 12px;display:flex;align-items:center;gap:12px;">

          <div style="width:42px;height:42px;border-radius:8px;background:rgba(251, 191, 36, 0.15);display:grid;place-items:center;font-size:22px;flex-shrink:0;">🍽️</div>

          <div>

            <div style="font-size:9px;font-weight:800;color:#fbbf24;text-transform:uppercase;">Tasting Menu</div>

            <div style="font-size:12px;font-weight:800;color:#ffffff;">Spring Truffle Pairing</div>

            <div style="font-size:10px;color:#94a3b8;">7-Course Experience</div>

          </div>

        </div>`;

      case 'photo_frame':

        return `<div style="width:100%;border-radius:10px;background:#181920;border:1px solid rgba(255,255,255,0.12);padding:10px;display:flex;align-items:center;gap:10px;">

          <div style="width:44px;height:44px;border-radius:6px;background:#27272a;display:grid;place-items:center;font-size:20px;flex-shrink:0;">📸</div>

          <div>

            <div style="font-size:10px;font-weight:800;color:#e4e4e7;">Florence Elopement</div>

            <div style="font-size:9px;color:#a1a1aa;margin-top:2px;">Featured in Vogue Weddings</div>

          </div>

        </div>`;

      case 'web3_stats':

        return `<div style="width:100%;border-radius:10px;background:rgba(56, 189, 248, 0.08);border:1px solid rgba(56, 189, 248, 0.3);padding:10px 12px;display:flex;align-items:center;justify-content:space-between;">

          <div>

            <div style="font-size:9px;font-weight:800;color:#38bdf8;text-transform:uppercase;">Protocol Vault</div>

            <div style="font-size:13px;font-weight:800;color:#ffffff;margin-top:2px;">$84.5M TVL</div>

          </div>

          <span style="font-size:10px;padding:3px 8px;background:#10b98125;color:#10b981;border-radius:6px;font-weight:800;">+18.4% APY</span>

        </div>`;

      case 'book_jacket':

        return `<div style="width:100%;border-radius:10px;background:#ffffff;border:1px solid #fed7aa;padding:10px 12px;display:flex;align-items:center;gap:10px;">

          <div style="width:36px;height:48px;border-radius:4px;background:#1e293b;color:#d97706;display:grid;place-items:center;font-size:16px;font-weight:900;flex-shrink:0;">📖</div>

          <div>

            <div style="font-size:10px;font-weight:800;color:#d97706;">#1 NYT Bestseller</div>

            <div style="font-size:12px;font-weight:800;color:#1e293b;">The Silent Isle</div>

            <div style="font-size:10px;color:#64748b;">Hardcover &amp; Audio</div>

          </div>

        </div>`;

      case 'agency_showcase':

      default:

        return `<div style="width:100%;border-radius:10px;background:linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.15));border:1px solid rgba(139, 92, 246, 0.3);padding:10px 12px;display:flex;align-items:center;gap:10px;">

          <div style="font-size:24px;">🏆</div>

          <div>

            <div style="font-size:9px;font-weight:800;color:#a855f7;text-transform:uppercase;">Featured Project</div>

            <div style="font-size:12px;font-weight:800;color:#ffffff;">FinTech Rebrand 2026</div>

            <div style="font-size:10px;color:#cbd5e1;">Awwwards Site of the Year</div>

          </div>

        </div>`;

    }

  }

  // Phone Preview Generator

  function renderPhonePreview(t, isLive = false, liveVals = {}) {

    const title = (isLive && liveVals.title !== undefined) ? liveVals.title : t.title;

    const tagline = (isLive && liveVals.tagline !== undefined) ? liveVals.tagline : t.tagline;

    const btn1 = (isLive && liveVals.btn1 !== undefined) ? liveVals.btn1 : t.btn1Text;

    const btn2 = (isLive && liveVals.btn2 !== undefined) ? liveVals.btn2 : t.btn2Text;

    return `

      <div class="template-phone-preview" style="background:${t.bgColor}; color:${t.textColor || '#ffffff'};">

        <div class="mini-notch" style="${isTemplateLight(t) ? 'background:rgba(0,0,0,0.18);' : 'background:rgba(0,0,0,0.45);'}"></div>

        ${renderTemplateAvatar(t)}

        <div style="font-weight:800; font-size:16px; margin-top:8px; text-align:center; color:${t.textColor || '#ffffff'}; letter-spacing:-0.02em;" id="${isLive ? 'mockupTitle' : ''}">${title}</div>

        <div style="font-size:11px; color:${t.textColor ? t.textColor + 'aa' : '#94a3b8'}; margin-top:3px; text-align:center; max-width:88%; line-height:1.3;" id="${isLive ? 'mockupTagline' : ''}">${tagline}</div>

        <div style="display:flex; gap:10px; align-items:center; margin:10px 0 12px; color:${t.textColor ? t.textColor + 'bb' : '#cbd5e1'};">

          ${t.socials.map(s => renderSocialIconSvg(s, t.textColor ? t.textColor + 'cc' : '#cbd5e1')).join('')}

        </div>

        <div style="display:flex; flex-direction:column; gap:7px; width:100%; margin-bottom:12px;">

          <div style="background:${t.btnBg}; color:${t.btnColor}; font-weight:700; font-size:11px; padding:8px 12px; border-radius:8px; text-align:center; box-shadow:${t.btnShadow}; border:1px solid rgba(255,255,255,0.08);" id="${isLive ? 'mockupBtn1' : ''}">

            ${btn1}

          </div>

          <div style="background:${t.btnBg}; color:${t.btnColor}; font-weight:700; font-size:11px; padding:8px 12px; border-radius:8px; text-align:center; box-shadow:${t.btnShadow}; border:1px solid rgba(255,255,255,0.08);" id="${isLive ? 'mockupBtn2' : ''}">

            ${btn2}

          </div>

        </div>

        ${renderTemplateFeatureCard(t)}

        <div style="margin-top:auto;padding-top:10px;font-size:9px;color:${t.textColor ? t.textColor + '66' : '#64748b'};">

          Powered by HEA Link

        </div>

      </div>

    `;

  }

  function renderView() {

    pages = getStoredPages();

    // 1. STEP 1: TEMPLATE CATALOG (Matching media_1793732573801_be66eb25.png)

    if (mode === 'catalog') {

      const categories = [

        'All templates',

        'Business & Hospitality',

        'Food & Drink',

        'Creator & Music',

        'Retail & Ecommerce',

        'Health & Fitness',

        'Tech & Web3'

      ];

      const filtered = activeCategory === 'All templates'

        ? templates

        : templates.filter(t => t.category === activeCategory);

      container.innerHTML = `

        <div class="view-header">

          <div>

            <h2 style="margin:0 0 4px;font-size:24px;">Choose a Template for Your Page</h2>

            <p style="color:#94a3b8;font-size:14px;margin:0;">Select a professionally crafted layout to showcase your links and brand.</p>

          </div>

          ${pages.length > 0 ? `<button class="sso-btn" style="width:auto;padding:8px 18px;" id="btnReturnToPageList">← Back to My Pages</button>` : ''}

        </div>

        <!-- Template Filter Pills (Matching Bitly category filters) -->

        <div style="display:flex;gap:10px;overflow-x:auto;padding-bottom:12px;margin:0 0 20px;align-items:center;">
          ${pages.length > 0 ? `<button class="sso-btn" style="width:auto;padding:7px 16px;white-space:nowrap;font-size:13px;margin-right:8px;border-radius:99px;" id="btnReturnToPageList">← Back to My Pages</button>` : ''}

          ${categories.map(cat => `

            <button class="home-type-tab ${activeCategory === cat ? 'active' : ''} filter-cat-btn" style="white-space:nowrap;padding:7px 18px;font-size:13px;" data-cat="${cat}">

              ${cat} ${cat === 'All templates' ? `(${templates.length})` : ''}

            </button>

          `).join('')}

        </div>

        <!-- 12 Smartphone-Styled Template Cards Grid -->

        <div class="template-grid" id="templateGrid">

          ${filtered.map(t => {
            const isLight = isTemplateLight(t);
            const cardBg = t.bgColor || (isLight ? "#ffffff" : "#0f172a");
            const footerBg = isLight
              ? `linear-gradient(180deg, ${t.bgColor} 0%, ${t.cardBg || "#ffffff"} 100%)`
              : `linear-gradient(180deg, ${t.bgColor} 0%, ${t.cardBg || "#111827"} 100%)`;
            const titleColor = isLight ? (t.textColor || "#1e293b") : "#ffffff";
            const descColor = isLight ? "#64748b" : "#94a3b8";
            const badgeBg = isLight ? `${t.accent}14` : `${t.accent}1a`;
            const badgeBorder = isLight ? `${t.accent}30` : `${t.accent}38`;
            const cardBorder = isLight ? `${t.accent}30` : `${t.accent}33`;
            const btnShadow = t.btnShadow && t.btnShadow !== "none"
              ? t.btnShadow
              : `0 4px 16px ${t.accent}35`;

            return `
            <div class="template-card ${isLight ? "template-card-light" : "template-card-dark"}" data-id="${t.id}" style="--tmpl-accent:${t.accent}; --tmpl-border:${cardBorder}; --tmpl-hover-shadow:${t.accent}38; --tmpl-footer-bg:${footerBg}; --tmpl-card-bg:${cardBg}; --tmpl-divider:${isLight ? t.accent + "20" : "rgba(255,255,255,0.08)"}; border:1.5px solid ${cardBorder}; background:${cardBg}; box-shadow: 0 10px 28px ${t.accent}12, 0 2px 6px rgba(0,0,0,0.04);">
              ${renderPhonePreview(t, false)}
              <div class="template-card-footer" style="background:${footerBg} !important; border-top: 1px solid ${isLight ? t.accent + "20" : "rgba(255,255,255,0.08)"};">
                <div>
                  <span class="template-badge-pill" style="font-size:10px;font-weight:800;color:${t.accent};background:${badgeBg};border:1px solid ${badgeBorder};padding:3px 8px;border-radius:6px;letter-spacing:1px;text-transform:uppercase;display:inline-block;margin-bottom:6px;">${t.badge}</span>
                  <h4 style="margin:4px 0 6px;color:${titleColor};font-size:16px;font-weight:700;letter-spacing:-0.01em;">${t.title}</h4>
                  <p style="font-size:12px;color:${descColor};line-height:1.45;margin:0 0 14px;">${t.desc}</p>
                </div>
                <button class="auth-submit-btn btn-use-template" data-id="${t.id}" style="width:100%;margin:0;padding:10px 14px;font-size:13px;font-weight:700;background:${t.btnBg};color:${t.btnColor};box-shadow:${btnShadow};border:none;border-radius:9999px;cursor:pointer;">
                  Use this template →
                </button>
              </div>
            </div>
            `;
          }).join('')}

        </div>

      `;

      const returnBtn = $('#btnReturnToPageList');

      if (returnBtn) returnBtn.onclick = () => { mode = 'list'; renderView(); };

      $$('.filter-cat-btn').forEach(btn => {

        btn.onclick = () => {

          activeCategory = btn.dataset.cat;

          renderView();

        };

      });

      $$('.template-card').forEach(card => {

        card.onclick = (e) => {

          const tid = card.dataset.id;

          const chosen = templates.find(t => t.id === tid) || templates[0];

          selectedTemplate = chosen;

          qrColor = '#00c6ff';

          mode = 'configure';

          renderView();

        };

      });

      return;

    }

    // 2. STEP 2: CONFIGURE HOW TO SHARE YOUR PAGE (Matching media_1793732605595_59cfbafd.png in Website Cyber Theme)

    if (mode === 'configure') {

      const initialSlug = selectedTemplate.id.replace(/_/g, '-');

      const initialTitle = selectedTemplate.title;

      const initialTagline = selectedTemplate.tagline;

      const initialBtn1 = selectedTemplate.btn1Text;

      const initialBtn2 = selectedTemplate.btn2Text;

      container.innerHTML = `

        <div class="view-header">

          <div style="display:flex;align-items:center;gap:14px;">

            <button class="sso-btn" id="btnBackToTemplates" style="width:auto;padding:8px 14px;font-weight:700;">← Back to Templates</button>

            <div>

              <h2 style="margin:0 0 2px;font-size:24px;">Configure how to share your page</h2>

              <p style="color:#94a3b8;font-size:13px;margin:0;">Setup your link and QR Code to get page visitors</p>

            </div>

          </div>

        </div>

        <div class="configure-mobile-toggle-bar">

          <button type="button" class="cfg-tab-btn active" id="btnCfgTabSettings">⚙️ Configure Settings</button>

          <button type="button" class="cfg-tab-btn" id="btnCfgTabPreview">📱 Live Mobile Preview</button>

        </div>

        <div class="configure-grid">

          <!-- Left Column: Settings Cards (Website Cyber Glass Theme) -->

          <div class="configure-col-settings" id="cfgColSettings">

            <!-- 1. Page URL Card -->

            <div class="configure-card">

              <h3 style="color:#0070f3;font-size:17px;font-weight:700;margin:0 0 14px;display:flex;align-items:center;gap:8px;">

                <span>🔗</span> Page URL

              </h3>

              <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap;">

                <select id="configBioDomain" class="home-domain-select" style="min-width:140px;">

                  <option value="healink.store" selected>healink.store</option>

                  <option value="hea.link">hea.link</option>

                  <option value="tinyurl.com">tinyurl.com</option>

                  <option value="healink.store">healink.store</option>

                  <option value="bit.ly">bit.ly</option>

                </select>

                <span style="color:#0070f3;font-size:15px;font-weight:800;padding:0 4px;">/m/</span>

                <input type="text" id="configBioSlug" class="home-shorten-input" style="flex:1;min-width:150px;" value="${initialSlug}" placeholder="custom-back-half" required>

              </div>

              <!-- Custom Domain Banner -->

              <div class="home-cyan-banner" style="margin-top:14px;">

                <span>👑</span>

                <span>Brand your page with a custom domain. <a href="#" onclick="window.openCheckoutModal('pro'); return false;">View Plans</a></span>

              </div>

            </div>

            <!-- 2. Page Content Details Card -->

            <div class="configure-card">

              <h3 style="color:#0070f3;font-size:17px;font-weight:700;margin:0 0 16px;display:flex;align-items:center;gap:8px;">

                <span>✏️</span> Page Content Details

              </h3>

              <div class="create-link-field" style="margin-bottom:14px;">

                <label style="font-size:12px;color:#cbd5e1;font-weight:600;display:block;margin-bottom:6px;">Page Title</label>

                <input type="text" id="configBioTitle" value="${initialTitle}" placeholder="e.g. The Grand Hotel">

              </div>

              <div class="create-link-field" style="margin-bottom:18px;">

                <label style="font-size:12px;color:#cbd5e1;font-weight:600;display:block;margin-bottom:6px;">Tagline / Description</label>

                <input type="text" id="configBioTagline" value="${initialTagline}" placeholder="e.g. Your new escape awaits">

              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">

                <div class="create-link-field">

                  <label style="font-size:12px;color:#cbd5e1;font-weight:600;display:block;margin-bottom:6px;">Primary Button Text</label>

                  <input type="text" id="configBtn1Text" value="${initialBtn1}">

                </div>

                <div class="create-link-field">

                  <label style="font-size:12px;color:#cbd5e1;font-weight:600;display:block;margin-bottom:6px;">Destination URL</label>

                  <input type="url" id="configBtn1Url" value="${selectedTemplate.btn1Url}">

                </div>

              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">

                <div class="create-link-field">

                  <label style="font-size:12px;color:#cbd5e1;font-weight:600;display:block;margin-bottom:6px;">Secondary Button Text</label>

                  <input type="text" id="configBtn2Text" value="${initialBtn2}">

                </div>

                <div class="create-link-field">

                  <label style="font-size:12px;color:#cbd5e1;font-weight:600;display:block;margin-bottom:6px;">Destination URL</label>

                  <input type="url" id="configBtn2Url" value="${selectedTemplate.btn2Url}">

                </div>

              </div>

            </div>

            <!-- 3. QR Code Card (Matching Image 2) -->

            <div class="configure-card">

              <h3 style="color:#0070f3;font-size:17px;font-weight:700;margin:0 0 16px;display:flex;align-items:center;gap:8px;">

                <span>▦</span> QR Code

              </h3>

              <div style="margin-bottom:18px;">

                <label style="font-size:12px;color:#64748b;font-weight:600;display:block;margin-bottom:10px;">Code color</label>

                <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">

                  ${[

                    { c: '#0070f3', name: 'Electric Blue' },

                    { c: '#00c6ff', name: 'Cyber Cyan' },

                    { c: '#10b981', name: 'Emerald' },

                    { c: '#f97316', name: 'Orange' },

                    { c: '#ef4444', name: 'Crimson' },

                    { c: '#8b5cf6', name: 'Purple' },

                    { c: '#ff007f', name: 'Pink' },

                    { c: '#060b18', name: 'Obsidian' }

                  ].map(col => `

                    <button class="color-dot-swatch ${qrColor === col.c ? 'active' : ''}" data-color="${col.c}" title="${col.name}" style="background:${col.c};border:2px solid ${col.c === '#060b18' ? '#ffffff33' : 'transparent'};"></button>

                  `).join('')}

                </div>

              </div>

              <!-- Logo Row -->

              <div style="margin-bottom:20px;">

                <label style="font-size:12px;color:#64748b;font-weight:600;display:block;margin-bottom:8px;">Logo</label>

                <div style="display:flex;gap:12px;align-items:center;">

                  <div style="width:44px;height:44px;border:1px dashed #cbd5e1;border-radius:10px;display:grid;place-items:center;color:#64748b;font-size:20px;background:#f8fafc;cursor:pointer;" onclick="window.openCheckoutModal('pro');">

                    +

                  </div>

                  <button class="sso-btn" style="width:auto;padding:8px 16px;font-size:13px;display:flex;align-items:center;gap:6px;" onclick="window.openCheckoutModal('pro');">

                    Add Logo <span style="color:#fbbf24;">👑</span>

                  </button>

                </div>

              </div>

              <!-- QR Code Preview Box -->

              <div style="display:flex;gap:18px;align-items:center;padding:16px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:14px;">

                <canvas id="configQrCanvas" width="105" height="105" style="border-radius:10px;background:#ffffff;padding:5px;flex-shrink:0;box-shadow:0 4px 14px rgba(0,70,200,0.08);border:1px solid #e2e8f0;"></canvas>

                <div>

                  <div style="font-weight:800;color:#0b132b;font-size:15px;margin-bottom:4px;">Preview</div>

                  <div style="font-size:12px;color:#64748b;line-height:1.5;">More customizations are available after creating</div>

                </div>

              </div>

            </div>

          </div>

          <!-- Right Column: Live Mobile Preview (Matching Image 2 in Cyber Phone Mockup) -->

          <div class="configure-col-preview" id="cfgColPreview" style="position:sticky;top:20px;">

            <div style="text-align:center;font-size:13px;font-weight:700;color:#38bdf8;margin-bottom:12px;letter-spacing:0.5px;text-transform:uppercase;">

              Live Mobile Preview

            </div>

            <div class="phone-mockup" style="box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px ${qrColor}40;">

              <div class="phone-notch"></div>

              <div class="phone-screen" id="mockupScreen" style="border-top:3px solid ${qrColor};background:${selectedTemplate.bgColor};color:${selectedTemplate.textColor || '#ffffff'};">

                ${renderPhonePreview(selectedTemplate, true, {

                  title: initialTitle,

                  tagline: initialTagline,

                  btn1: initialBtn1,

                  btn2: initialBtn2

                })}

              </div>

            </div>

          </div>

        </div>

        <!-- Sticky Bottom Actions Bar (Matching Image 2) -->

        <div class="sticky-bottom-actions">

          <button class="sso-btn" style="width:auto;padding:10px 24px;font-weight:700;" id="btnCancelConfig">Back</button>

          <button class="auth-submit-btn" style="margin:0;padding:11px 32px;font-size:14px;background:linear-gradient(135deg, #0070f3, #00c6ff);box-shadow:0 4px 20px rgba(0, 198, 255, 0.4);" id="btnPublishConfiguredPage">

            Create your page →

          </button>

        </div>

      `;

      const updateLiveQR = () => {

        const cv = $('#configQrCanvas');

        const slug = ($('#configBioSlug')?.value.trim() || 'my-page').toLowerCase();

        const domain = $('#configBioDomain')?.value || 'healink.store';

        if (cv && typeof window.drawQR === 'function') {

          window.drawQR(cv, `https://${domain}/m/${slug}`, qrColor, '#ffffff', 105);

        }

      };

      setTimeout(updateLiveQR, 50);

      // Real-Time 2-Way Binding with Mobile Mockup

      const titleIn = $('#configBioTitle');

      const tagIn = $('#configBioTagline');

      const slugIn = $('#configBioSlug');

      const domainIn = $('#configBioDomain');

      const btn1In = $('#configBtn1Text');

      const btn2In = $('#configBtn2Text');

      if (titleIn) {

        titleIn.oninput = () => {

          const val = titleIn.value || selectedTemplate.title;

          const m = $('#mockupTitle');

          if (m) m.textContent = val;

        };

      }

      if (tagIn) {

        tagIn.oninput = () => {

          const val = tagIn.value || selectedTemplate.tagline;

          const m = $('#mockupTagline');

          if (m) m.textContent = val;

        };

      }

      if (btn1In) {

        btn1In.oninput = () => {

          const val = btn1In.value || selectedTemplate.btn1Text;

          const m = $('#mockupBtn1');

          if (m) m.textContent = val;

        };

      }

      if (btn2In) {

        btn2In.oninput = () => {

          const val = btn2In.value || selectedTemplate.btn2Text;

          const m = $('#mockupBtn2');

          if (m) m.textContent = val;

        };

      }

      if (slugIn) {

        slugIn.oninput = updateLiveQR;

      }

      if (domainIn) {

        domainIn.onchange = () => {

          chosenDomain = domainIn.value;

          updateLiveQR();

        };

      }

      // Color Swatches Interactive Picker

      $$('.color-dot-swatch').forEach(dot => {

        dot.onclick = () => {

          qrColor = dot.dataset.color;

          $$('.color-dot-swatch').forEach(d => d.classList.toggle('active', d === dot));

          const scr = $('#mockupScreen');

          if (scr) scr.style.borderTopColor = qrColor;

          const mockup = $('.phone-mockup');

          if (mockup) mockup.style.boxShadow = `0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px ${qrColor}40`;

          updateLiveQR();

        };

      });

      // Mobile View Switcher between Settings & Live Phone Mockup

      const tabSettings = $('#btnCfgTabSettings');

      const tabPreview = $('#btnCfgTabPreview');

      const colSettings = $('#cfgColSettings');

      const colPreview = $('#cfgColPreview');

      if (tabSettings && tabPreview && colSettings && colPreview) {

        tabSettings.onclick = () => {

          tabSettings.classList.add('active');

          tabPreview.classList.remove('active');

          colSettings.classList.remove('hidden-mobile');

          colPreview.classList.add('hidden-mobile');

        };

        tabPreview.onclick = () => {

          tabPreview.classList.add('active');

          tabSettings.classList.remove('active');

          colPreview.classList.remove('hidden-mobile');

          colSettings.classList.add('hidden-mobile');

        };

        if (window.innerWidth <= 768) {

          colPreview.classList.add('hidden-mobile');

        }

      }

      $('#btnBackToTemplates').onclick = () => { mode = 'catalog'; renderView(); };

      $('#btnCancelConfig').onclick = () => { mode = 'catalog'; renderView(); };

      // Save & Publish Page Action

      $('#btnPublishConfiguredPage').onclick = async () => {

        const rawSlug = $('#configBioSlug')?.value.trim() || selectedTemplate.id.replace(/_/g, '-');

        const slug = rawSlug.toLowerCase().replace(/[^a-z0-9-]/g, '') || 'my-page';

        const domain = $('#configBioDomain')?.value || 'healink.store';

        const title = $('#configBioTitle')?.value.trim() || selectedTemplate.title;

        const tagline = $('#configBioTagline')?.value.trim() || selectedTemplate.tagline;

        const btn1Text = $('#configBtn1Text')?.value.trim() || selectedTemplate.btn1Text;

        const btn1Url = $('#configBtn1Url')?.value.trim() || selectedTemplate.btn1Url;

        const btn2Text = $('#configBtn2Text')?.value.trim() || selectedTemplate.btn2Text;

        const btn2Url = $('#configBtn2Url')?.value.trim() || selectedTemplate.btn2Url;

        const newPage = {

          slug,

          domain,

          title,

          tagline,

          btn1Text,

          btn1Url,

          btn2Text,

          btn2Url,

          templateId: selectedTemplate.id,

          links: [
            ...(btn1Url ? [{ label: btn1Text || 'Link 1', url: btn1Url }] : []),
            ...(btn2Url ? [{ label: btn2Text || 'Link 2', url: btn2Url }] : [])
          ],

          url: `${(domain && domain !== 'healink.store' && domain !== window.location.hostname) ? 'https://' + domain : window.location.origin}/m/${slug}`,

          color: qrColor,

          views: 0,

          engagements: 0,

          createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

        };

        // Persist Bio Page to MongoDB via REST API before updating local list
        const token = getAuthToken();
        if (!token) {
          window.appShell.toast('Please log in to publish a Bio Page');
          return;
        }
        try {
          const bioRes = await fetch('/api/bios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
            body: JSON.stringify({
              slug,
              title: newPage.title,
              tagline: newPage.tagline,
              avatar: newPage.avatar || '',
              theme: newPage.theme || 'cyber-dark',
              links: newPage.links || []
            })
          });
          if (bioRes.status === 401) {
            handleUnauthorizedSession();
            return;
          }
          const bioData = await bioRes.json().catch(() => ({}));
          if (!bioRes.ok) {
            if (bioRes.status === 403 && bioData.code === 'PLAN_LIMIT_REACHED') {
              window.appShell.toast(bioData.error || 'Bio page limit reached for current plan.');
              if (typeof window.openCheckoutModal === 'function') window.openCheckoutModal('pro');
              return;
            }
            window.appShell.toast(bioData.error || 'Failed to publish bio page');
            return;
          }
          const serverBio = bioData && (bioData.page || bioData.bio);
          const savedBio = serverBio ? {
            ...newPage,
            ...serverBio,
            id: serverBio._id || serverBio.id || newPage.slug,
            url: `${(domain && domain !== 'healink.store' && domain !== window.location.hostname) ? 'https://' + domain : window.location.origin}/m/${serverBio.slug || slug}`
          } : newPage;
          state.cachedBios.unshift(savedBio);
          window.appShell.toast(`Page created successfully: ${savedBio.url}`);
          window.appShell.copy(savedBio.url);
          mode = 'list';
          renderView();
        } catch (err) {
          window.appShell.toast(err.message || 'Unable to reach server to publish bio page');
        }

      };

      return;

    }

    // 3. STEP 3: PUBLISHED PAGES LIST VIEW

    if (pages.length === 0) {

      container.innerHTML = `

        <div class="view-header">
          <div class="header-title-col">
            <div style="display:flex;align-items:center;gap:10px;">
              <h2>Bio Pages</h2>
              <span class="pro-chip nav-pro-badge" style="font-size:11px;padding:2px 8px;">PRO</span>
            </div>
            <p class="view-subtitle">
              Mobile-optimized bio landing pages, link collections, social channels, and product showcases.
            </p>
          </div>
          <div class="header-actions-col">
            <button class="header-primary-btn" id="btnLaunchTemplateCatalog">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Create page
            </button>
          </div>
        </div>

        <div style="text-align:center;padding:50px 24px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:16px;max-width:560px;margin:32px auto;">

          <div style="font-size:36px;margin-bottom:12px;">📱</div>

          <h3 style="color:#0070f3;font-size:18px;font-weight:800;margin:0 0 8px;">No bio pages created yet</h3>

          <p style="color:#64748b;font-size:14px;margin:0 0 20px;line-height:1.6;">Build a single high-converting mobile bio page to showcase all your links, social media profiles, and offers.</p>

          <button class="auth-submit-btn" id="btnEmptyCreateBio" style="width:auto;margin:0 auto;padding:12px 28px;">+ Choose a Template</button>

        </div>

      `;

      const openCatalog = () => { mode = 'catalog'; renderView(); };

      $('#btnLaunchTemplateCatalog').onclick = openCatalog;

      const emptyBtn = $('#btnEmptyCreateBio');

      if (emptyBtn) emptyBtn.onclick = openCatalog;

      return;

    }

    container.innerHTML = `

      <div class="view-header">
          <div class="header-title-col">
            <div style="display:flex;align-items:center;gap:10px;">
              <h2>Bio Pages</h2>
              <span class="pro-chip nav-pro-badge" style="font-size:11px;padding:2px 8px;">PRO</span>
            </div>
            <p class="view-subtitle">
              Mobile-optimized bio landing pages, link collections, social channels, and product showcases.
            </p>
          </div>
          <div class="header-actions-col">
            <button class="header-primary-btn" id="btnLaunchTemplateCatalog">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Create page
            </button>
          </div>
        </div>

      <div class="page-search-bar-row">

        <div class="dash-search-box" style="max-width:380px;">
          <svg class="search-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" class="dash-search-input page-search-input" id="pageSearchInput" placeholder="Search bio pages by title, handle, or bio..." autocomplete="off">
        </div>

        <span class="page-count-badge" id="pageCountBadge">${pages.length} published page${pages.length === 1 ? '' : 's'}</span>

      </div>

      <div id="pagesListContainer">

      ${pages.map(p => {

        const bioUrl = p.url || `${origin}/m/${p.slug}`;

        return `

          <div class="page-row-card" data-slug="${p.slug}" data-title="${(p.title || '').toLowerCase()}" data-tagline="${(p.tagline || '').toLowerCase()}">

            <div class="page-row-main">

              <div class="page-wireframe-thumb" style="background:${p.color || '#00c6ff'}15;border-color:${p.color || '#00c6ff'}40;">

                <span style="font-weight:800;color:${p.color || '#ffffff'};">${p.title ? p.title.slice(0, 10) : 'Page'}</span>

                <div class="wireframe-bar" style="background:${p.color || '#00c6ff'};opacity:0.8;"></div>

                <div class="wireframe-bar"></div>

                <div class="wireframe-bar"></div>

              </div>

              <div class="page-row-info">

                <h3 class="page-row-title">

                  <a href="${bioUrl}" target="_blank" rel="noopener">${bioUrl} ↗</a>

                </h3>

                <div class="page-row-tagline">${p.tagline || 'Custom verified landing page'} • Created ${p.createdAt || 'Recent'}</div>

                <div class="page-row-stats">

                  <span>📊 <b>${p.views || 0}</b> views</span>

                  <span>🎯 <b>${p.engagements || 0}</b> engagements</span>

                </div>

              </div>

            </div>

            <div class="page-row-actions">

              <a class="auth-submit-btn page-live-btn" href="${bioUrl}" target="_blank" rel="noopener">

                🚀 View Live Page

              </a>

              <button class="topbar-icon-btn" title="Copy Bio Link" onclick="window.appShell.copy('${bioUrl}')">📋</button>

              <button class="topbar-icon-btn" title="Share QR" onclick="window.appShell.navigate('qr-detail', '${p.slug}')">▦</button>

              <button class="topbar-icon-btn" style="color:#ef4444;" title="Delete Page" onclick="window.appShell.deletePage('${p.slug}')">🗑️</button>

            </div>

          </div>

        `;

      }).join('')}

      </div>

      <div style="text-align:center;color:#64748b;font-size:13px;margin:40px 0;">

        • You've reached the end of your Pages •

      </div>

    `;

    const pSearch = $('#pageSearchInput');

    if (pSearch) {

      pSearch.oninput = () => {

        const q = pSearch.value.toLowerCase().trim();

        $$('.page-row-card').forEach(card => {

          const match = !q || card.dataset.slug.includes(q) || card.dataset.title.includes(q) || card.dataset.tagline.includes(q);

          card.style.display = match ? 'flex' : 'none';

        });

      };

    }

    $('#btnLaunchTemplateCatalog').onclick = () => {

      mode = 'catalog';

      renderView();

    };

  }

  renderView();

  // Clean static rendering for page templates with zero jitter

}
