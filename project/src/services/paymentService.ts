import { Buffer } from 'buffer';
import { supabase } from './supabase';

interface PaymentRequest {
  amount: number;
  customer: {
    name: string;
    email: string;
    cpf: string;
  };
  planName: string;
  postbackUrl: string;
}

export async function createPayment(data: PaymentRequest) {
  try {
    // Validar CPF
    if (!data.customer.cpf?.trim()) {
      throw new Error('CPF é obrigatório para realizar o pagamento');
    }

    const { data: session } = await supabase.auth.getSession();
    
    if (!session?.session?.user?.id) {
      throw new Error('Usuário não autenticado. Por favor, faça login novamente.');
    }

    const userId = session.session.user.id;

    // Verificar se o perfil existe
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      throw new Error('Erro ao verificar perfil do usuário');
    }

    if (!profile) {
      // Criar perfil se não existir
      const { error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: session.session.user.email,
          name: data.customer.name
        });

      if (createProfileError) {
        throw new Error('Erro ao criar perfil do usuário');
      }
    }

    // Buscar plano pelo nome exato
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('name', data.planName)
      .eq('active', true)
      .single();

    if (planError) {
      console.error('Erro ao buscar plano:', planError);
      throw new Error('Erro ao buscar plano');
    }

    if (!plan) {
      console.error('Plano não encontrado:', data.planName);
      throw new Error(`Plano não encontrado: ${data.planName}`);
    }

    // Criar pagamento
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        plan_id: plan.id,
        amount: plan.price,
        status: 'pending',
        metadata: {
          customer: data.customer,
          plan_name: plan.name,
          plan_duration: plan.duration_hours
        }
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Erro ao criar pagamento:', paymentError);
      throw paymentError;
    }

    // Configurar webhook URL
    const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payment-webhook`;
    
    // Preparar dados para a API de pagamento
    const paymentData = {
      amount: Number(payment.amount).toFixed(2),
      customer: {
        name: data.customer.name,
        email: data.customer.email,
        document: data.customer.cpf.replace(/\D/g, ''),
        phone: null
      },
      pix: {
        expiresInDays: 2,
        key: 'random',
        description: `Pagamento do plano ${plan.name}`
      },
      postbackUrl: webhookUrl,
      metadata: JSON.stringify({
        payment_id: payment.id,
        user_id: userId,
        plan_id: plan.id,
        plan_name: plan.name,
        plan_duration: plan.duration_hours
      })
    };

    console.log('Enviando requisição para API:', paymentData);

    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payment-gateway`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(paymentData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Erro na resposta da API:', errorData);
          throw new Error(errorData.error || 'Erro ao processar pagamento');
        }

        const responseData = await response.json();
        console.log('Resposta da API:', responseData);

        // Atualizar pagamento com os dados da transação
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            payment_code: responseData.paymentCode,
            transaction_id: responseData.idTransaction,
            metadata: {
              ...payment.metadata,
              payment_code: responseData.paymentCode,
              payment_code_base64: responseData.paymentCodeBase64,
              qr_code: responseData.qrCode
            }
          })
          .eq('id', payment.id);

        if (updateError) {
          console.error('Erro ao atualizar pagamento:', updateError);
          throw updateError;
        }

        return responseData;
      } catch (apiError) {
        console.error(`Tentativa ${retryCount + 1} falhou:`, apiError);
        retryCount++;

        if (retryCount === maxRetries) {
          throw new Error('Erro ao comunicar com a API de pagamento após várias tentativas. Por favor, tente novamente.');
        }

        // Esperar antes de tentar novamente (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      }
    }

    throw new Error('Erro inesperado ao processar pagamento');
  } catch (error) {
    console.error('Erro ao criar pagamento:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Ocorreu um erro ao processar o pagamento. Por favor, tente novamente.'
    );
  }
}

export async function checkTransactionStatus(idTransaction: string) {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payment-status`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idTransaction })
      }
    );

    if (!response.ok) {
      throw new Error('Erro ao verificar status do pagamento');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao verificar status da transação:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Ocorreu um erro ao verificar o status da transação.'
    );
  }
}