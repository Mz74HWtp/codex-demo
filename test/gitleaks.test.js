import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

// CI supplies the verified binary. Ordinary npm test needs only Node.js.
const binary = process.env.GITLEAKS_BINARY;

test('Gitleaks detects secrets and redacts its output', {
  skip: binary ? false : 'Set GITLEAKS_BINARY to run scanner integration tests',
}, async (t) => {
  assert.equal(typeof binary, 'string');
  assert.ok(binary.length > 0 && binary.length <= 4096 && !binary.includes('\0'));

  function scan(input) {
    const result = spawnSync(binary, [
      'stdin', '--redact=100', '--verbose', '--no-banner', '--no-color', '--exit-code=1',
    ], { input, encoding: 'utf8', timeout: 30_000, windowsHide: true });
    assert.ifError(result.error);
    assert.equal(result.signal, null);
    return { status: result.status, output: result.stdout + result.stderr };
  }

  await t.test('clean input succeeds', () => {
    assert.equal(scan('console.log("Hello DevSecOps");\n').status, 0);
  });

  // Synthetic values are assembled at runtime, never valid service credentials.
  const dummy = ['Q7m2', 'R9v4', 'N6x8', 'K3z5', 'T1w0', 'P8j6', 'S4c9', 'H2b7', 'L5d3'].join('');
  const cases = [
    { name: 'API key', value: dummy, input: `api_key = "${dummy}"\n`, rule: 'generic-api-key' },
    { name: 'token', value: `ghp_${dummy}`, input: `token = "ghp_${dummy}"\n`, rule: 'github-pat' },
    { name: 'password', value: dummy, input: `password = "${dummy}"\n`, rule: 'generic-api-key' },
    {
      name: 'private key',
      value: dummy.repeat(3),
      input: ['-----BEGIN ' + 'PRIVATE KEY-----', dummy.repeat(3), '-----END ' + 'PRIVATE KEY-----'].join('\n'),
      rule: 'private-key',
    },
  ];

  for (const { name, value, input, rule } of cases) {
    await t.test(`${name} fails with exit code 1 and stays redacted`, () => {
      const result = scan(input);
      assert.equal(result.status, 1);
      assert.ok(result.output.includes(rule), `Expected detection rule: ${rule}`);
      assert.ok(!result.output.includes(value), 'Synthetic secret must be redacted');
    });
  }
});
