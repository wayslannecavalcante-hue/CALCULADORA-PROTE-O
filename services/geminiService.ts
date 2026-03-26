import { GoogleGenAI } from "@google/genai";
import { FunnelData, CalculatedMetrics } from "../types";

let ai: GoogleGenAI | null = null;

const getAiClient = () => {
  if (!ai) {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("API Key is missing. Please set GEMINI_API_KEY in your environment variables.");
    }
    // Initialize even if missing to let the API call fail gracefully later, or handle it here
    ai = new GoogleGenAI({ apiKey: apiKey || 'missing-key' });
  }
  return ai;
};

export const generateActionPlan = async (
  data: FunnelData,
  metrics: CalculatedMetrics
): Promise<string> => {
  const prompt = `
    Atue como um estrategista de marketing digital sênior analisando um funil de vendas para uma ASSOCIAÇÃO DE PROTEÇÃO VEICULAR (PV).
    
    CONTEXTO DO CLIENTE:
    - O cliente usa o Reportei para puxar Leads.
    - As metas de conversão padrão para este nicho são: 
      1. Lead -> Contato Feito: 70%
      2. Contato Feito -> Cotação: 60%
      3. Cotação -> Adesão: 20%
      (Meta Global Lead -> Adesão: ~8.4%)
    
    DADOS FINANCEIROS:
    - Investimento Meta: R$ ${data.metaConfig.investment.toFixed(2)} | Realizado: R$ ${data.realizedInputs.investment.toFixed(2)}
    - Ticket Médio (Adesão): R$ ${data.realizedInputs.ticketAvg.toFixed(2)}
    
    FUNIL COMPARATIVO:
    1. LEADS: Meta ${data.meta.leads} vs Realizado ${data.realized.leads}
    2. CONTATOS FEITOS: Meta ${data.meta.appointments} vs Realizado ${data.realized.appointments}
    3. COTAÇÕES: Meta ${data.meta.visits} vs Realizado ${data.realized.visits}
    4. ADESÕES: Meta ${data.meta.sales} vs Realizado ${data.realized.sales}
    
    TAXAS DE CONVERSÃO (Meta Padronizada vs Realizado):
    - Lead -> Contato Feito: Meta 70% vs Realizado ${metrics.conversion.leadToAppt.realized.toFixed(1)}%
    - Contato Feito -> Cotação: Meta 60% vs Realizado ${metrics.conversion.apptToVisit.realized.toFixed(1)}%
    - Cotação -> Adesão: Meta 20% vs Realizado ${metrics.conversion.visitToSale.realized.toFixed(1)}%
    
    UNIT ECONOMICS (Realizado):
    - CPL: R$ ${metrics.cpl.realized.toFixed(2)} (Meta: R$ ${metrics.cpl.meta.toFixed(2)})
    - CAC (Custo de Aquisição por Associado): R$ ${metrics.cac.realized.toFixed(2)} (Meta: R$ ${metrics.cac.meta.toFixed(2)})
    - ROAS: ${metrics.roas.realized.toFixed(2)}x
    
    TAREFA:
    1. Identifique o GAP principal no funil de Proteção Veicular (ex: time comercial não está conseguindo contatar, ou as cotações não estão fechando).
    2. Sugira ações táticas focadas em PV (ex: script de vendas, remarketing para quem cotou, recuperação de leads frios).
    3. Crie um "Plano de Ação" com 3 itens táticos e imediatos.
    4. Use Markdown. Seja objetivo e profissional.
  `;

  try {
    const client = getAiClient();
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 1024 }
      }
    });

    return response.text || "Não foi possível gerar a análise no momento.";
  } catch (error) {
    console.error("Erro ao chamar Gemini API:", error);
    return "Erro ao conectar com a inteligência artificial. Verifique sua chave de API.";
  }
};