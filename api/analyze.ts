import { GoogleGenAI } from "@google/genai";
import type { Employee, Task, FinanceData } from '../types';

interface ContextData {
    employees: Employee[];
    tasks: Task[];
    financeData: FinanceData[];
}

// Esta função será detectada como uma função serverless por plataformas como a Vercel.
// Para melhor tipagem, você poderia adicionar o pacote `@vercel/node` e usar
// `import type { VercelRequest, VercelResponse } from '@vercel/node';`
// e então definir o handler como `handler(req: VercelRequest, res: VercelResponse)`
export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    
    console.log("Function /api/analyze invoked.");

    try {
        const { userInput, contextData }: { userInput: string; contextData: ContextData } = req.body;
        
        if (!userInput || !contextData) {
            console.error("Bad Request: Missing userInput or contextData.");
            return res.status(400).json({ error: 'Faltando userInput ou contextData no corpo da requisição' });
        }
        
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            console.error("Server Configuration Error: API_KEY environment variable is not set or not accessible in the production environment.");
            return res.status(500).json({ error: 'A chave da API não está configurada no servidor. Verifique as variáveis de ambiente no painel da Vercel para o ambiente de Produção.' });
        }
        
        console.log("API_KEY found. Initializing GoogleGenAI client.");

        const ai = new GoogleGenAI({
            apiKey: apiKey, // Use the variable to ensure it's the one we checked
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
        
        console.log("Sending request to Google Gemini API...");
        
        const genAIResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [userQueryPart, dataContextPart] },
            config: {
                systemInstruction: systemInstruction,
            }
        });
        
        console.log("Received response from Google Gemini API.");
        
        const aiText = genAIResponse.text;
        
        if (!aiText) {
            console.error("Gemini API returned an empty response text.");
            return res.status(500).json({ error: 'A resposta do serviço de IA estava vazia.' });
        }

        return res.status(200).json({ response: aiText.trim() });

    } catch (error: any) {
        console.error("--- UNHANDLED ERROR in /api/analyze ---");
        console.error("Error Message:", error.message);
        if (error.stack) {
            console.error("Error Stack:", error.stack);
        }
        if(error.details) {
            console.error("Error Details:", error.details);
        }
        console.error("--- END OF ERROR ---");

        // Provide a more specific error message if it's a known type
        if (error.message && error.message.includes('API key not valid')) {
             return res.status(401).json({ error: 'A chave da API fornecida é inválida.' });
        }

        return res.status(500).json({ error: 'Falha ao processar a solicitação de IA. Verifique os logs do servidor na Vercel para mais detalhes.' });
    }
}
