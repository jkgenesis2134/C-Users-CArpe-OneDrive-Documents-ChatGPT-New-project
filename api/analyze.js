const evaluationSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    manuscriptScore: { type: 'number' },
    verdict: { type: 'string' },
    paperType: { type: 'string' },
    completionStatus: { type: 'string' },
    bindingConstraint: { type: 'string' },
    dimensions: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { name: { type: 'string' }, score: { type: 'number' }, rationale: { type: 'string' } }, required: ['name','score','rationale'] } },
    revisions: { type: 'array', items: { type: 'string' } },
    limitations: { type: 'array', items: { type: 'string' } }
  },
  required: ['manuscriptScore','verdict','paperType','completionStatus','bindingConstraint','dimensions','revisions','limitations']
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({error:'AI provider is not configured'});
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
  if (!text) return res.status(400).json({error:'Manuscript text is required'});
  if (text.length > 120000) return res.status(413).json({error:'Manuscript exceeds the 120,000 character limit'});
  const prompt = `Evaluate the manuscript below using CareerMaker's principles. Be candid and evidence-based. Do not invent citations, statistics, sources, or publication guarantees. Score each dimension from 0 to 5: Research Contribution, Theory, Literature, Methods, Statistical Analysis, Results, Discussion, Implications, Limitations, Writing Quality. A manuscript-only review audits reported methods and internal consistency; it cannot verify that analyses were executed correctly. Keep AI-writing and research-integrity concerns separate from scholarly quality. Return only the requested JSON.\n\nMANUSCRIPT:\n${text}`;
  try {
    const response = await fetch('https://api.openai.com/v1/responses', { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.OPENAI_API_KEY}`}, body:JSON.stringify({ model:process.env.OPENAI_MODEL || 'gpt-5.4', store:false, input:prompt, text:{format:{type:'json_schema',name:'careermaker_evaluation',strict:true,schema:evaluationSchema}} }) });
    const data = await response.json();
    if (!response.ok) return res.status(502).json({error:'AI provider request failed', detail:data?.error?.message || 'Unknown provider error'});
    const output = data.output_text || '';
    let evaluation;
    try { evaluation = JSON.parse(output); } catch { return res.status(502).json({error:'AI provider returned invalid structured output'}); }
    return res.status(200).json({evaluation, provider:'openai', model:data.model || process.env.OPENAI_MODEL || 'configured-model'});
  } catch (error) {
    return res.status(502).json({error:'AI provider is temporarily unavailable'});
  }
};

