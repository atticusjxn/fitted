import { FastifyInstance } from 'fastify';
import { supabase } from '../services/supabase.js';
import { notifications } from '../services/notifications.js';

export async function schedulingRoutes(app: FastifyInstance) {
  app.get('/leads/:id/scheduling', async (request, reply) => {
    const leadId = (request.params as { id?: string }).id;
    if (!leadId) return reply.badRequest('lead id required');

    const { data, error } = await supabase
      .from('lead_scheduling')
      .select('*')
      .eq('lead_id', leadId)
      .maybeSingle();

    if (error) {
      app.log.error(error, 'failed to fetch scheduling');
      return reply.status(500).send({ message: 'Failed to load scheduling' });
    }

    return reply.send({ scheduling: data });
  });

  app.post('/leads/:id/scheduling/status', async (request, reply) => {
    const leadId = (request.params as { id?: string }).id;
    if (!leadId) return reply.badRequest('lead id required');

    const body = request.body as {
      status?: 'pending' | 'link_sent' | 'booked' | 'cancelled';
      scheduled_start_at?: string;
      scheduled_end_at?: string;
      notify_to?: string;
    };

    const { error } = await supabase
      .from('lead_scheduling')
      .update({
        status: body.status,
        scheduled_start_at: body.scheduled_start_at,
        scheduled_end_at: body.scheduled_end_at,
        updated_at: new Date().toISOString()
      })
      .eq('lead_id', leadId);

    if (error) {
      app.log.error(error, 'failed to update scheduling status');
      return reply.status(500).send({ message: 'Failed to update scheduling' });
    }

    // Optional SMS notification when moving to booked
    if (body.notify_to && body.status === 'booked') {
      try {
        await notifications.sendReminder({
          to: body.notify_to,
          leadId,
          scheduledStart: body.scheduled_start_at
        });
      } catch (err) {
        app.log.error(err, 'failed to send booking notification sms');
      }
    }

    return reply.send({ ok: true });
  });
}
