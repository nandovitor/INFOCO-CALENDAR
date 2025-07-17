import { GoogleGenAI } from "@google/genai";
import type { Employee, Task, FinanceData } from '../types';

interface ContextData {
    employees: Employee[];
    tasks: Task[];
    financeData: FinanceData[];
}

// Esta função será detectada como uma função serverless por plataformas como a Vercel.
// Ela usa implicitamente objetos de requisição e resposta do Node.js.
export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // A Vercel analisa automaticamente o corpo para solicitações POST com content-type JSON.
        const { userInput, contextData }: { userInput: string; contextData: ContextData } = req.body;
        
        if (!userInput || !contextData) {
            return res.status(400).json({ error: 'Faltando userInput ou contextData no corpo da requisição' });
        }
        
        if (!process.env.AIzaSyA2ZP6K0SMi8iUHhYFtNzuwAlPx_3icS_c) {
            return res.status(500).json({ error: 'A chave da API não está configurada no servidor.' });
        }

        const ai = new GoogleGenAI({
            apiKey: process.env.AIzaSyA2ZP6K0SMi8iUHhYFtNzuwAlPx_3icS_c,
        });

        const systemInstruction = `Você é um assistente de análise de dados para um sistema de gestão chamado Infoco.
Sua tarefa é analisar os dados em formato JSON fornecidos no prompt e responder à pergunta do usuário de forma clara, concisa e útil.
Atenha-se estritamente aos dados fornecidos. Os dados contêm três arrays principais: 'employees', 'tasks', e 'financeData'.
- 'employees': Contém informações sobre os funcionários da empresa.
- 'tasks': Contém uma lista de tarefas atribuídas aos funcionários, incluindo status e horas.
- 'financeData': Contém dados financeiros relacionados aos municípios.
Sempre formate sua resposta usando markdown para melhor legibilidade (use **negrito** para destacar termos importantes, *itálico*, e listas de itens com hífens ou asteriscos).
Se a pergunta não puder ser respondida com os dados fornecidos, informe educadamente que a informação não está disponível. Não invente informações.
Seja direto e objetivo na resposta.`;
        
        const userQueryPart = {
            text: `**PERGUNTA DO USUÁRIO:**\n${userInput}`
        };

        const dataContextPart = {
            text: `\n\n---\n\n**DADOS PARA ANÁLISE (JSON):**\n${JSON.stringify(contextData, null, 2)}`
        };
        
        const genAIResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [userQueryPart, dataContextPart] },
            config: {
                systemInstruction: systemInstruction,
            }
        });
        
        const aiText = genAIResponse.text;
        
        if (!aiText) {
             return res.status(500).json({ error: 'A resposta do serviço de IA estava vazia.' });
        }

        return res.status(200).json({ response: aiText.trim() });

    } catch (error: any) {
        console.error("Error in /api/analyze:", error);
        return res.status(500).json({ error: 'Falha ao processar a solicitação de IA.' });
    }
}
