import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { agentId } = req.query;
  const { name, email, phone } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Name, email, and phone are required' });
  }

  try {
    // Create conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        agent_id: agentId,
        visitor_name: name,
        visitor_email: email,
        visitor_phone: phone,
        status: 'active',
        is_lead: true,
        lead_captured_at: new Date().toISOString(),
        source: 'widget',
      })
      .select()
      .single();

    if (convError) throw convError;

    // Create lead entry
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        agent_id: agentId,
        conversation_id: conversation.id,
        name,
        email,
        phone,
        status: 'new',
        source: 'widget',
      })
      .select()
      .single();

    if (leadError) throw leadError;

    return res.status(200).json({
      success: true,
      conversationId: conversation.id,
      leadId: lead.id,
    });
  } catch (error) {
    console.error('Lead capture error:', error);
    return res.status(500).json({ error: 'Failed to capture lead' });
  }
}
