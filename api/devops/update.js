import { requireAuth } from '../_auth.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const pat = process.env.AZURE_DEVOPS_PAT;
  const org = process.env.AZURE_DEVOPS_ORG;
  const project = process.env.AZURE_DEVOPS_PROJECT;
  const apiVersion = process.env.AZURE_DEVOPS_API_VERSION || '7.0';

  if (!pat || !org || !project) {
    return res.status(500).json({ error: 'Chybi konfigurace Azure DevOps ve Vercel Environment Variables.' });
  }

  const auth = Buffer.from(':' + pat).toString('base64');
  const { ids, iterationPath, addTag } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids must be a non-empty array' });
  }

  const results = [];
  const errors = [];

  for (const id of ids) {
    try {
      // GET current fields
      const getUrl = 'https://dev.azure.com/' + org + '/' + project + '/_apis/wit/workitems/' + id + '?fields=System.Tags,System.IterationPath&api-version=' + apiVersion;
      const getResp = await fetch(getUrl, {
        headers: { Authorization: 'Basic ' + auth, Accept: 'application/json' }
      });

      if (!getResp.ok) {
        const getErr = await getResp.text();
        errors.push({ id, step: 'GET', status: getResp.status, error: getErr.substring(0, 300) });
        continue;
      }

      const current = await getResp.json();
      const currentTags = current.fields ? (current.fields['System.Tags'] || '') : '';

      let newTags = currentTags;
      if (addTag && !currentTags.toLowerCase().includes(addTag.toLowerCase())) {
        newTags = currentTags ? currentTags + '; ' + addTag : addTag;
      }

      const ops = [];
      if (iterationPath) {
        ops.push({ op: 'add', path: '/fields/System.IterationPath', value: iterationPath });
      }
      if (addTag) {
        ops.push({ op: 'add', path: '/fields/System.Tags', value: newTags });
      }

      if (ops.length === 0) {
        results.push({ id, status: 'skipped' });
        continue;
      }

      const patchUrl = 'https://dev.azure.com/' + org + '/' + project + '/_apis/wit/workitems/' + id + '?api-version=' + apiVersion;
      const patchResp = await fetch(patchUrl, {
        method: 'PATCH',
        headers: {
          Authorization: 'Basic ' + auth,
          'Content-Type': 'application/json-patch+json',
          Accept: 'application/json'
        },
        body: JSON.stringify(ops)
      });

      const patchText = await patchResp.text();

      if (patchResp.ok) {
        let updated;
        try { updated = JSON.parse(patchText); } catch { updated = {}; }
        results.push({ id, status: 'ok', newIteration: updated.fields ? updated.fields['System.IterationPath'] : null, newTags: updated.fields ? updated.fields['System.Tags'] : null });
      } else {
        errors.push({ id, step: 'PATCH', status: patchResp.status, error: patchText.substring(0, 300) });
      }
    } catch (e) {
      errors.push({ id, step: 'catch', error: e.message });
    }
  }

  return res.status(200).json({ updated: results.length, errorsCount: errors.length, results, errors });
}
