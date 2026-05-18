import { requireAuth } from '../_auth.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const pat = process.env.AZURE_DEVOPS_PAT;
  const org = process.env.AZURE_DEVOPS_ORG;
  const project = process.env.AZURE_DEVOPS_PROJECT;
  const apiVersion = process.env.AZURE_DEVOPS_API_VERSION || '7.1';

  if (!pat || !org || !project) return res.status(500).json({ error: 'Missing ADO config' });

  const auth = Buffer.from(':' + pat).toString('base64');
  const { ids, iterationPath, addTag } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'ids required' });

  const results = [];
  const errors = [];

  for (const id of ids) {
    try {
      const getResp = await fetch(
        'https://dev.azure.com/' + org + '/' + project + '/_apis/wit/workitems/' + id + '?fields=System.Tags,System.IterationPath&api-version=' + apiVersion,
        { headers: { Authorization: 'Basic ' + auth, Accept: 'application/json' } }
      );
      if (!getResp.ok) {
        errors.push({ id, step: 'GET', status: getResp.status, wwwAuth: getResp.headers.get('WWW-Authenticate'), error: (await getResp.text()).substring(0, 300) });
        continue;
      }
      const current = await getResp.json();
      const currentTags = (current.fields && current.fields['System.Tags']) || '';
      let newTags = currentTags;
      if (addTag && !currentTags.toLowerCase().includes(addTag.toLowerCase())) {
        newTags = currentTags ? currentTags + '; ' + addTag : addTag;
      }
      const ops = [];
      if (iterationPath) ops.push({ op: 'add', path: '/fields/System.IterationPath', value: iterationPath });
      if (addTag) ops.push({ op: 'add', path: '/fields/System.Tags', value: newTags });
      if (ops.length === 0) { results.push({ id, status: 'skipped' }); continue; }

      const patchResp = await fetch(
        'https://dev.azure.com/' + org + '/' + project + '/_apis/wit/workitems/' + id + '?api-version=' + apiVersion,
        { method: 'PATCH', headers: { Authorization: 'Basic ' + auth, 'Content-Type': 'application/json-patch+json', Accept: 'application/json' }, body: JSON.stringify(ops) }
      );
      const patchText = await patchResp.text();
      if (patchResp.ok) {
        let updated = {}; try { updated = JSON.parse(patchText); } catch {}
        results.push({ id, status: 'ok', newIteration: updated.fields?.['System.IterationPath'], newTags: updated.fields?.['System.Tags'] });
      } else {
        errors.push({ id, step: 'PATCH', status: patchResp.status, wwwAuth: patchResp.headers.get('WWW-Authenticate'), error: patchText.substring(0, 300) });
      }
    } catch(e) { errors.push({ id, step: 'catch', error: e.message }); }
  }
  return res.status(200).json({ updated: results.length, errorsCount: errors.length, results, errors });
}
