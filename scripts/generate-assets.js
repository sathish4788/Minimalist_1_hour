import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

// 1. Mobile Screenshot (390 x 844)
const mobileSvg = `
<svg width="390" height="844" viewBox="0 0 390 844" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="390" height="844" fill="#0B0F17"/>
  <!-- Status bar -->
  <text x="28" y="38" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600">9:41</text>
  
  <!-- Header -->
  <rect x="24" y="60" width="36" height="36" rx="10" fill="#F59E0B"/>
  <path d="M36 78 L41 83 L50 71" stroke="#000000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="70" y="80" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="700">MinimaList</text>
  <text x="70" y="93" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">1-Hour Auto Reminder</text>
  
  <!-- Stats Card -->
  <rect x="20" y="115" width="350" height="64" rx="16" fill="#1E293B" stroke="#334155" stroke-width="1"/>
  <text x="36" y="142" fill="#F59E0B" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="700">3</text>
  <text x="36" y="160" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">Active</text>
  <text x="140" y="142" fill="#38BDF8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="700">2</text>
  <text x="140" y="160" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">Due &lt; 1hr</text>
  <text x="250" y="142" fill="#10B981" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="700">8</text>
  <text x="250" y="160" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">Completed</text>

  <!-- Input Area Mock -->
  <rect x="20" y="195" width="350" height="48" rx="14" fill="#1E293B" stroke="#475569" stroke-width="1"/>
  <text x="36" y="225" fill="#64748B" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13">Add task... (1-hr timer starts immediately)</text>
  <rect x="326" y="203" width="32" height="32" rx="8" fill="#F59E0B"/>
  <text x="338" y="224" fill="#000000" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="bold">+</text>

  <!-- Tasks Section -->
  <text x="24" y="275" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600">Pending Tasks (3)</text>
  
  <!-- Task 1: High Priority -->
  <rect x="20" y="290" width="350" height="88" rx="16" fill="#1E293B" stroke="#F59E0B" stroke-width="1.5"/>
  <circle cx="44" cy="324" r="10" stroke="#F59E0B" stroke-width="2" fill="none"/>
  <text x="64" y="322" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600">Review Android TWA Submission</text>
  <rect x="64" y="338" width="50" height="18" rx="5" fill="#EF4444" fill-opacity="0.2"/>
  <text x="72" y="351" fill="#F87171" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="600">HIGH</text>
  <rect x="120" y="338" width="50" height="18" rx="5" fill="#3B82F6" fill-opacity="0.2"/>
  <text x="130" y="351" fill="#60A5FA" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10">Dev</text>
  <rect x="270" y="320" width="85" height="24" rx="12" fill="#F59E0B" fill-opacity="0.15"/>
  <text x="282" y="336" fill="#F59E0B" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600">⏱ 42m left</text>

  <!-- Task 2 -->
  <rect x="20" y="390" width="350" height="88" rx="16" fill="#1E293B" stroke="#334155" stroke-width="1"/>
  <circle cx="44" cy="424" r="10" stroke="#64748B" stroke-width="2" fill="none"/>
  <text x="64" y="422" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600">Verify PWABuilder Web Manifest</text>
  <rect x="64" y="438" width="60" height="18" rx="5" fill="#3B82F6" fill-opacity="0.2"/>
  <text x="72" y="451" fill="#60A5FA" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10">Release</text>
  <rect x="270" y="420" width="85" height="24" rx="12" fill="#38BDF8" fill-opacity="0.15"/>
  <text x="282" y="436" fill="#38BDF8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600">⏱ 54m left</text>

  <!-- Task 3 -->
  <rect x="20" y="490" width="350" height="88" rx="16" fill="#1E293B" stroke="#334155" stroke-width="1"/>
  <circle cx="44" cy="524" r="10" stroke="#64748B" stroke-width="2" fill="none"/>
  <text x="64" y="522" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600">Scan Receipt with AI Camera</text>
  <rect x="64" y="538" width="55" height="18" rx="5" fill="#10B981" fill-opacity="0.2"/>
  <text x="74" y="551" fill="#34D399" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10">Finance</text>
  <rect x="270" y="520" width="85" height="24" rx="12" fill="#38BDF8" fill-opacity="0.15"/>
  <text x="282" y="536" fill="#38BDF8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600">⏱ 59m left</text>

  <!-- Bottom Navigation / Quick Actions -->
  <rect x="20" y="740" width="350" height="54" rx="20" fill="#0F172A" stroke="#334155" stroke-width="1"/>
  <text x="50" y="772" fill="#F59E0B" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600">Tasks</text>
  <text x="150" y="772" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12">AI Camera</text>
  <text x="260" y="772" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12">Analytics</text>
</svg>
`;

// 2. Desktop Screenshot (1280 x 720)
const desktopSvg = `
<svg width="1280" height="720" viewBox="0 0 1280 720" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1280" height="720" fill="#0B0F17"/>
  <!-- Top bar -->
  <rect x="0" y="0" width="1280" height="64" fill="#0F172A" stroke="#1E293B" stroke-width="1"/>
  <rect x="40" y="16" width="32" height="32" rx="8" fill="#F59E0B"/>
  <path d="M50 32 L55 37 L62 26" stroke="#000000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="84" y="38" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="700">MinimaList</text>
  <text x="180" y="38" fill="#64748B" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12">1-Hour Auto-Reminder Engine</text>

  <!-- Main Container -->
  <g transform="translate(240, 90)">
    <!-- Header Summary Cards -->
    <rect x="0" y="0" width="240" height="80" rx="14" fill="#1E293B" stroke="#334155" stroke-width="1"/>
    <text x="24" y="34" fill="#F59E0B" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="700">3</text>
    <text x="24" y="58" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13">Active Tasks</text>

    <rect x="270" y="0" width="240" height="80" rx="14" fill="#1E293B" stroke="#334155" stroke-width="1"/>
    <text x="294" y="34" fill="#38BDF8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="700">2</text>
    <text x="294" y="58" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13">Expiring in 1 Hour</text>

    <rect x="540" y="0" width="240" height="80" rx="14" fill="#1E293B" stroke="#334155" stroke-width="1"/>
    <text x="564" y="34" fill="#10B981" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="700">8</text>
    <text x="564" y="58" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13">Completed Today</text>

    <!-- Task List -->
    <rect x="0" y="110" width="780" height="52" rx="12" fill="#1E293B" stroke="#475569" stroke-width="1"/>
    <text x="24" y="142" fill="#64748B" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14">What needs to get done within the next hour? (Press Enter)...</text>
    <rect x="700" y="118" width="68" height="36" rx="8" fill="#F59E0B"/>
    <text x="716" y="141" fill="#000000" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600">+ Add</text>

    <!-- Task Items -->
    <rect x="0" y="180" width="780" height="74" rx="12" fill="#1E293B" stroke="#F59E0B" stroke-width="1.5"/>
    <circle cx="36" cy="217" r="10" stroke="#F59E0B" stroke-width="2" fill="none"/>
    <text x="64" y="214" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="600">Review Android TWA Submission Package for Google Play</text>
    <text x="64" y="235" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">Created 18m ago • Scheduled chime alert at 60m</text>
    <rect x="660" y="202" width="100" height="28" rx="14" fill="#F59E0B" fill-opacity="0.15"/>
    <text x="674" y="221" fill="#F59E0B" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600">⏱ 42m left</text>

    <rect x="0" y="266" width="780" height="74" rx="12" fill="#1E293B" stroke="#334155" stroke-width="1"/>
    <circle cx="36" cy="303" r="10" stroke="#64748B" stroke-width="2" fill="none"/>
    <text x="64" y="300" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="600">Verify PWABuilder Web Manifest detection</text>
    <text x="64" y="321" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">Created 6m ago • Scheduled chime alert at 60m</text>
    <rect x="660" y="288" width="100" height="28" rx="14" fill="#38BDF8" fill-opacity="0.15"/>
    <text x="674" y="307" fill="#38BDF8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600">⏱ 54m left</text>
  </g>
</svg>
`;

async function run() {
  await sharp(Buffer.from(mobileSvg))
    .png()
    .toFile(path.join(publicDir, 'screenshot-mobile.png'));
  console.log('Generated screenshot-mobile.png');

  await sharp(Buffer.from(desktopSvg))
    .png()
    .toFile(path.join(publicDir, 'screenshot-desktop.png'));
  console.log('Generated screenshot-desktop.png');
}

run().catch(console.error);
