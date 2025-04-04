import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Inicializar cliente Supabase
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      persistSession: false,
    }
  }
);

async function processPayment(payload: any) {
  try {
    // Registrar webhook
    const { data: webhook, error: webhookError } = await supabaseClient
      .from('payment_webhooks')
      .insert({
        transaction_id: payload.idTransaction,
        event_type: payload.status,
        payload: payload,
      })
      .select()
      .single();

    if (webhookError) throw webhookError;

    // Se o pagamento foi aprovado
    if (payload.status === 'approved') {
      // Buscar pagamento pelo transaction_id
      const { data: payment, error: paymentError } = await supabaseClient
        .from('payments')
        .select('*, plans(*)')
        .eq('transaction_id', payload.idTransaction)
        .single();

      if (paymentError) throw paymentError;

      if (!payment) {
        throw new Error('Pagamento não encontrado');
      }

      // Calcular data de expiração
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + payment.plans.duration_hours);

      // Atualizar status do pagamento
      const { error: updateError } = await supabaseClient
        .from('payments')
        .update({
          status: 'completed',
          paid_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .eq('id', payment.id);

      if (updateError) throw updateError;

      // Atualizar webhook como processado
      await supabaseClient
        .from('payment_webhooks')
        .update({ processed: true })
        .eq('id', webhook.id);

      return { success: true, message: 'Pagamento processado com sucesso' };
    }

    return { success: true, message: 'Webhook registrado' };
  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
  // Lidar com preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Verificar método
    if (req.method !== 'POST') {
      throw new Error('Método não permitido');
    }

    // Verificar Content-Type
    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new Error('Content-Type deve ser application/json');
    }

    // Processar payload
    const payload = await req.json();
    const result = await processPayment(payload);

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Erro no webhook:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
      }),
      {
        status: error instanceof Error ? 400 : 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});