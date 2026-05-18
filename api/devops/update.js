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
    return res.status(500).json({ error: 'Chybí konfigurace Azure DevOps ve Vercel Environment Variables.' });
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
      // First GET current tags for this work item
      const getResp = await fetch(
        `https://dev.azure.com/${org}/${project}/_apis/wit/workitems/${id}?fields=System.Tags,System.IterationPath&api-version=${apiVersion}`,
        { headers: { Authorization: `Basic ${auth}` } }
      );
      const current = await getResp.json();
      const currentTags = current.fields?.['System.Tags'] || '';
      
      // Build new tags - add carry-over if not already present
      let newTags = currentTags;
      if (addTag && !currentTags.toLowerCase().includes(addTag.toLowerCase())) {
        newTags = currentTags ? currentTags + '; ' + addTag : addTag;
      }

      // Build patch operations
      const ops = [];
      if (iterationPath) {
        ops.push({ op: 'add', path: '/fields/System.IterationPath', value: iterationPath });
      }
      if (addTag) {
        ops.push({ op: 'add', path: '/fields/System.Tags', value: newTags });
      }

      if (ops.length === 0) {
        results.push({ id, status: 'skipped', reason: 'no operations' });
        continue;
      }

      const patchResp = await fetch(
        `https://dev.azure.com/${org}/${project}/_apis/wit/workitems/${id}?api-version=${apiVersion}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json-patch+json'
          },
          body: JSON.stringify(ops)
        }
      );

      if (patchResp.ok) {
        const updated = await patchResp.json();
        results.push({ id, status: 'ok', newIteration: updated.fields?.['System.IterationPath'], newTags: updated.fields?.['System.Tags'] });
      } else {
        const err = await patchResp.text();
        errors.push({ id, status: patchResp.status, error: err.substring(0, 200) });
      }
    } catch (e) {
      errors.push({ id, error: e.message });
    }
  }

  return res.status(200).json({ updated: results.length, errors: errors.length, results, errors });
}
