import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const API_KEY = '6da2858faf08bc2456dc87b7';
const BASE_URL = 'https://api.syncpay.pro/s1/withdraw/api/createWithdraw.php';

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      persistSession: false,
    }
  }
);

async function processWithdrawal(userId: string, amount: number) {
  try {
    console.log('Iniciando processamento de saque para usuário:', userId);

    // Get user's wallet and profile
    const [walletResponse, profileResponse] = await Promise.all([
      supabaseClient
        .from('beta_game_wallets')
        .select('*')
        .eq('user_id', userId)
        .single(),
      supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
    ]);

    if (walletResponse.error) throw walletResponse.error;
    if (profileResponse.error) throw profileResponse.error;

    const wallet = walletResponse.data;
    const profile = profileResponse.data;

    if (!wallet) throw new Error('Carteira não encontrada');
    if (!profile) throw new Error('Perfil não encontrado');

    // Validate withdrawal
    if (!wallet.can_withdraw) {
      throw new Error('Você precisa movimentar 100% do valor depositado para sacar');
    }

    if (wallet.balance < amount) {
      throw new Error('Saldo insuficiente');
    }

    if (!profile.cpf) {
      throw new Error('CPF não cadastrado. Atualize seu perfil para sacar.');
    }

    console.log('Enviando solicitação de saque para a API de pagamento');

    // Send withdrawal request to payment API
    const encodedApiKey = btoa(API_KEY);
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${encodedApiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        amount: amount.toFixed(2),
        customer: {
          name: profile.name || 'Usuário',
          email: profile.email,
          document: profile.cpf.replace(/\D/g, '')
        },
        pixKey: {
          type: 'cpf',
          key: profile.cpf.replace(/\D/g, '')
        },
        description: `Saque de R$ ${amount.toFixed(2)} da carteira de jogos`,
        callbackUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/withdrawal-webhook`
      })
    });

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      console.error('Resposta não-JSON da API:', await response.text());
      throw new Error('Erro de comunicação com a API de pagamento');
    }

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Erro na API de pagamento:', data);
      throw new Error(data.message || 'Erro ao processar saque na API de pagamento');
    }

    console.log('Resposta da API de pagamento:', data);

    // Update wallet balance and create transaction
    const { error: txError } = await supabaseClient.rpc('process_withdrawal', {
      p_user_id: userId,
      p_wallet_id: wallet.id,
      p_amount: amount,
      p_withdrawal_id: data.withdrawalId
    });

    if (txError) throw txError;

    console.log('Saque processado com sucesso');
    return { 
      success: true, 
      message: 'Saque processado com sucesso',
      withdrawalId: data.withdrawalId
    };
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const { userId, amount } = await req.json();

    if (!userId || !amount) {
      throw new Error('Dados de saque inválidos');
    }

    const result = await processWithdrawal(userId, amount);

    return new Response(
      JSON.stringify(result),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Erro no processamento:', error);
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