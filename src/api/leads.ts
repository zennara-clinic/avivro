import { db } from '../lib/supabase';

export interface LeadData {
  name: string;
  email: string;
  phone: string;
}

export async function captureLeadAPI(agentId: string, leadData: LeadData, conversationId?: string) {
  try {
    // Create or get conversation first
    let convId = conversationId;
    
    if (!convId) {
      const { data: conv, error: convError } = await db.conversations.create({
        agent_id: agentId,
        visitor_name: leadData.name,
        visitor_email: leadData.email,
        visitor_phone: leadData.phone,
        status: 'active',
        is_lead: true,
        lead_captured_at: new Date().toISOString(),
      });

      if (convError) throw convError;
      convId = conv.id;
    } else {
      // Update existing conversation with lead info
      await db.conversations.update(convId, {
        visitor_name: leadData.name,
        visitor_email: leadData.email,
        visitor_phone: leadData.phone,
        is_lead: true,
        lead_captured_at: new Date().toISOString(),
      });
    }

    // Create lead entry
    const { data: lead, error: leadError } = await db.leads.create({
      agent_id: agentId,
      conversation_id: convId,
      name: leadData.name,
      email: leadData.email,
      phone: leadData.phone,
      status: 'new',
      source: 'widget',
    });

    if (leadError) throw leadError;

    return { success: true, conversationId: convId, leadId: lead.id };
  } catch (error: any) {
    console.error('Lead capture error:', error);
    throw new Error(`Failed to capture lead: ${error.message}`);
  }
}
