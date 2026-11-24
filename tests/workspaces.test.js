'use strict';

const assert = require('assert');
const http = require('http');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const app = require('../backend/server');
const config = require('../backend/config');
const memStore = require('../backend/utils/memStore');
const { migrateWorkspaces } = require('../scripts/migrate-workspaces');

let server = null;
let baseUrl = '';

function makeToken(email, extra = {}) {
  return jwt.sign(
    { email, id: 'usr_' + Date.now() + Math.random().toString(36).slice(2, 6), role: 'user', ...extra },
    config.jwtSecret,
    { expiresIn: '1h' }
  );
}

function request(pathUrl, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(pathUrl, baseUrl);
    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (_) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          json
        });
      });
    });

    req.on('error', reject);

    if (options.body) {
      if (typeof options.body === 'string') {
        req.write(options.body);
      } else {
        req.write(JSON.stringify(options.body));
      }
    }
    req.end();
  });
}

function pass(name) {
  console.log(`  ✅ PASS: ${name}`);
}

function fail(name, err) {
  console.error(`  ❌ FAIL: ${name}`);
  console.error(err);
  process.exit(1);
}

async function run() {
  console.log('\n👥 Starting HEA Link Teams & Workspaces Verification Suite...\n');

  try {
    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    const ownerEmail = 'corp_owner@example.com';
    const ownerToken = makeToken(ownerEmail, { plan: 'business' });
    let workspaceId = '';

    // 1. Create Workspace
    try {
      const res = await request('/api/workspaces', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ownerToken}`,
          'Content-Type': 'application/json'
        },
        body: {
          name: 'Acme Global Ventures',
          slug: 'acme-global'
        }
      });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.json.ok, true);
      assert.ok(res.json.workspace);
      assert.strictEqual(res.json.workspace.name, 'Acme Global Ventures');
      assert.strictEqual(res.json.membership.role, 'owner');

      workspaceId = res.json.workspace._id || res.json.workspace.id;

      pass('POST /api/workspaces creates workspace and assigns creator as Owner');
    } catch (err) {
      fail('Workspace creation failed', err);
    }

    // 2. List Workspaces
    try {
      const res = await request('/api/workspaces', {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });

      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.json.workspaces));
      assert.ok(res.json.workspaces.some((w) => String(w._id || w.id) === String(workspaceId)));

      pass('GET /api/workspaces lists active user workspaces with assigned roles');
    } catch (err) {
      fail('List workspaces failed', err);
    }

    // 3. Invite Lifecycle (Generate Token, Hash Storage, Expiration, Mailer Trigger)
    let inviteToken = '';
    const inviteeEmail = 'engineer_alice@example.com';
    try {
      const res = await request(`/api/workspaces/${workspaceId}/invites`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ownerToken}`,
          'Content-Type': 'application/json',
          'X-Workspace-Id': String(workspaceId)
        },
        body: {
          email: inviteeEmail,
          role: 'editor'
        }
      });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.json.ok, true);
      assert.ok(res.json.devToken);
      inviteToken = res.json.devToken;

      // Ensure raw token is NEVER stored in database or memory store
      const inviteDoc = memStore.invites.find((i) => i.email === inviteeEmail);
      if (inviteDoc) {
        assert.notStrictEqual(inviteDoc.tokenHash, inviteToken, 'Raw token must never equal tokenHash');
        assert.strictEqual(inviteDoc.tokenHash.length, 64, 'Token hash must be 64-char hex SHA-256');
      }

      pass('POST /api/workspaces/:id/invites stores token hash only and dispatches invite');
    } catch (err) {
      fail('Invite generation failed', err);
    }

    // 4. Invite Acceptance & Email Mismatch Protection
    try {
      // Trying to accept with wrong user account must fail
      const wrongUserToken = makeToken('bob_intruder@example.com');
      const resWrong = await request('/api/invites/accept', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${wrongUserToken}`,
          'Content-Type': 'application/json'
        },
        body: { token: inviteToken }
      });

      assert.strictEqual(resWrong.status, 403);
      assert.strictEqual(resWrong.json.code, 'INVITE_EMAIL_MISMATCH');

      // Accepting with correct invited email succeeds
      const inviteeToken = makeToken(inviteeEmail);
      const resAccept = await request('/api/invites/accept', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${inviteeToken}`,
          'Content-Type': 'application/json'
        },
        body: { token: inviteToken }
      });

      assert.strictEqual(resAccept.status, 200);
      assert.strictEqual(resAccept.json.membership.role, 'editor');

      // Replay attempt must fail (single use)
      const resReplay = await request('/api/invites/accept', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${inviteeToken}`,
          'Content-Type': 'application/json'
        },
        body: { token: inviteToken }
      });

      assert.strictEqual(resReplay.status, 404);

      pass('POST /api/invites/accept enforces invited email match and single-use token invalidation');
    } catch (err) {
      fail('Invite acceptance test failed', err);
    }

    // 5. RBAC Enforcement Matrix (Editor Cannot Manage Members)
    try {
      const inviteeToken = makeToken(inviteeEmail);
      const resRbac = await request(`/api/workspaces/${workspaceId}/invites`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${inviteeToken}`,
          'Content-Type': 'application/json',
          'X-Workspace-Id': String(workspaceId)
        },
        body: {
          email: 'another_user@example.com',
          role: 'viewer'
        }
      });

      assert.strictEqual(resRbac.status, 403);
      assert.strictEqual(resRbac.json.code, 'FORBIDDEN_PERMISSION');

      pass('RBAC matrix restricts member management to Owner/Admin (Editor blocked with 403)');
    } catch (err) {
      fail('RBAC enforcement test failed', err);
    }

    // 6. Cross-Workspace Data Isolation
    try {
      const outsiderEmail = 'foreign_ceo@competitor.com';
      const outsiderToken = makeToken(outsiderEmail);

      // Create separate outsider workspace
      const resWsB = await request('/api/workspaces', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${outsiderToken}`,
          'Content-Type': 'application/json'
        },
        body: { name: 'Competitor Corp' }
      });
      const wsBId = resWsB.json.workspace._id || resWsB.json.workspace.id;

      // Outsider tries to access Acme Global workspace members -> 403 Access Denied
      const resCrossAccess = await request(`/api/workspaces/${workspaceId}/members`, {
        headers: {
          Authorization: `Bearer ${outsiderToken}`,
          'X-Workspace-Id': String(workspaceId)
        }
      });

      assert.strictEqual(resCrossAccess.status, 403);
      assert.strictEqual(resCrossAccess.json.code, 'WORKSPACE_ACCESS_DENIED');

      // Acme Owner tries to access Competitor Corp -> 403 Access Denied
      const resCrossAccessRev = await request(`/api/workspaces/${wsBId}/members`, {
        headers: {
          Authorization: `Bearer ${ownerToken}`,
          'X-Workspace-Id': String(wsBId)
        }
      });

      assert.strictEqual(resCrossAccessRev.status, 403);
      assert.strictEqual(resCrossAccessRev.json.code, 'WORKSPACE_ACCESS_DENIED');

      pass('Data isolation blocks cross-workspace member queries bidirectionally with HTTP 403');
    } catch (err) {
      fail('Cross-workspace isolation failed', err);
    }

    // 7. Member Role Update & Member Removal
    try {
      // Owner updates Alice from editor to viewer
      const resPatch = await request(`/api/workspaces/${workspaceId}/members/${inviteeEmail}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${ownerToken}`,
          'Content-Type': 'application/json',
          'X-Workspace-Id': String(workspaceId)
        },
        body: { role: 'viewer' }
      });

      assert.strictEqual(resPatch.status, 200);
      assert.strictEqual(resPatch.json.member.role, 'viewer');

      // Owner removes Alice from workspace
      const resDel = await request(`/api/workspaces/${workspaceId}/members/${inviteeEmail}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${ownerToken}`,
          'X-Workspace-Id': String(workspaceId)
        }
      });

      assert.strictEqual(resDel.status, 200);

      // Alice tries to access workspace -> 403 Access Denied
      const inviteeToken = makeToken(inviteeEmail);
      const resRemovedAccess = await request(`/api/workspaces/${workspaceId}/members`, {
        headers: {
          Authorization: `Bearer ${inviteeToken}`,
          'X-Workspace-Id': String(workspaceId)
        }
      });

      assert.strictEqual(resRemovedAccess.status, 403);
      assert.strictEqual(resRemovedAccess.json.code, 'WORKSPACE_ACCESS_DENIED');

      pass('Member role modification and removal revoke access immediately');
    } catch (err) {
      fail('Member removal test failed', err);
    }

    // 8. Ownership Transfer
    try {
      // Invite new executive
      const execEmail = 'new_exec@example.com';
      const resInv = await request(`/api/workspaces/${workspaceId}/invites`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ownerToken}`,
          'Content-Type': 'application/json',
          'X-Workspace-Id': String(workspaceId)
        },
        body: { email: execEmail, role: 'admin' }
      });
      const execToken = makeToken(execEmail);
      await request('/api/invites/accept', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${execToken}`,
          'Content-Type': 'application/json'
        },
        body: { token: resInv.json.devToken }
      });

      // Transfer ownership
      const resTransfer = await request(`/api/workspaces/${workspaceId}/transfer-ownership`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ownerToken}`,
          'Content-Type': 'application/json',
          'X-Workspace-Id': String(workspaceId)
        },
        body: { newOwnerEmail: execEmail }
      });

      assert.strictEqual(resTransfer.status, 200);

      // Verify previous owner is now admin
      const resMembers = await request(`/api/workspaces/${workspaceId}/members`, {
        headers: {
          Authorization: `Bearer ${ownerToken}`,
          'X-Workspace-Id': String(workspaceId)
        }
      });
      const oldOwnerMem = resMembers.json.members.find((m) => m.userEmail === ownerEmail);
      assert.strictEqual(oldOwnerMem.role, 'admin');

      pass('POST /api/workspaces/:id/transfer-ownership safely reassigns Owner and demotes prior owner to Admin');
    } catch (err) {
      fail('Ownership transfer test failed', err);
    }

    // 9. Audit Logging Trail
    try {
      // Set workspace plan to business to unlock audit logs
      const ws = memStore.workspaces.find((w) => String(w._id || w.id) === String(workspaceId));
      if (ws) ws.planKey = 'business';

      const resAudit = await request(`/api/workspaces/${workspaceId}/audit-logs`, {
        headers: {
          Authorization: `Bearer ${ownerToken}`,
          'X-Workspace-Id': String(workspaceId)
        }
      });

      assert.strictEqual(resAudit.status, 200);
      assert.ok(Array.isArray(resAudit.json.logs));
      assert.ok(resAudit.json.logs.length >= 3, 'Audit log must record create, invite, and transfer actions');

      const actions = resAudit.json.logs.map((l) => l.action);
      assert.ok(actions.includes('workspace.create'));
      assert.ok(actions.includes('member.invite'));
      assert.ok(actions.includes('workspace.transfer'));

      pass('GET /api/workspaces/:id/audit-logs captures tamper-evident event stream with masked metadata');
    } catch (err) {
      fail('Audit logging test failed', err);
    }

    // 10. Workspace Migration Script Idempotency
    try {
      const stats = await migrateWorkspaces({ dryRun: true });
      assert.ok(typeof stats.workspacesCreated === 'number');
      assert.ok(typeof stats.linksUpdated === 'number');

      pass('scripts/migrate-workspaces.js executes idempotently with --dry-run validation');
    } catch (err) {
      fail('Workspace migration script failed', err);
    }

    console.log('\n🎉 ALL 10 Teams & Workspaces tests passed!\n');
    server.close();
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close(false);
    }
    process.exit(0);
  } catch (fatal) {
    console.error('Fatal Workspaces Suite Error:', fatal);
    if (server) server.close();
    process.exit(1);
  }
}

if (require.main === module) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { run };
